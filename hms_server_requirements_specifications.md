# Hospital Management System (HMS) — Server Technical Specifications

This document outlines the detailed system architecture, software requirements, hardware specifications, and security policies for deploying the **Hospital Management System (HMS)**. 

The HMS is built as a **unified monorepo** consisting of a **Laravel 11** backend REST API, a **React 18** Single Page Application (SPA) compiled via Vite, and a **MySQL 8** database. High-performance asynchronous processing is offloaded to a **Redis 7** queue managed by Laravel Horizon, and real-time alerts are handled via a Pusher-compatible WebSocket server.

---

## 1. Hosting Environment & Server Type Recommendation

Due to the modern stack requirements (including Docker containerization, Redis in-memory key-value store, Laravel Horizon, and background process management via Supervisor), **Shared Hosting is NOT supported**. 

We require one of the following deployment environments:
*   **Virtual Private Server (VPS)**: Standard cloud VPS (e.g., DigitalOcean Droplets, Linode/Akamai, Hetzner Cloud, AWS EC2, Google Compute Engine).
*   **Managed Cloud Infrastructure**: Managed Kubernetes (EKS, GKE), container runner services (AWS ECS, Google Cloud Run), or platform-as-a-service (PaaS) environments that support multi-container Docker Compose.
*   **Dedicated Server**: For large hospitals requiring high resource isolation, strict compliance, and maximum performance.

### Deployment Methodologies Support
The project is built to support two primary deployment approaches:
1.  **Containerized (Docker/Docker Compose)**: Multi-container setup containing PHP-FPM 8.3, Nginx, MySQL 8, Redis 7, and Supervisor (Laravel Horizon + Cron Scheduler).
2.  **Infrastructure as Code (Terraform)**: Provisioning of virtual compute instances (EC2/Droplets), managed MySQL DBs (RDS/Cloud SQL), and managed Redis caches.

---

## 2. Software Stack & Runtime Specifications

If deploying on a bare server/VPS (non-Docker setup), the hosting environment must support the following runtime environments and libraries:

### 2.1 Backend Runtime (PHP 8.3+)
*   **PHP Version**: `8.3` (or higher)
*   **Process Manager**: `PHP-FPM` (recommended)
*   **Required PHP Extensions**:
    *   `openssl` (Secure communication)
    *   `pdo_mysql` (MySQL database connection)
    *   `mbstring` (Multi-byte string handling for multi-language support)
    *   `tokenizer` & `xml` / `dom` / `libxml` (XML/Document parsing)
    *   `curl` (External API consumption)
    *   `zip` (Archive management)
    *   `gd` or `imagick` (Required for image processing and barcode generation)
    *   `bcmath` (Required for precise currency and billing calculations)
    *   `redis` (PHP Redis extension for queue and caching)

### 2.2 Frontend Build System (Node.js 20+)
*   **Node.js Version**: `20.x` LTS (Active LTS version)
*   **Package Manager**: `npm` (included in Node)
*   *Note*: Node.js is only strictly required on the build/deployment server to compile the React SPA assets via Vite (`npm run build`). Once compiled, Nginx serves the static assets directly, meaning Node.js does not need to run as a daemon process in the production environment.

### 2.3 Web Server (Nginx)
*   **Web Server**: `Nginx` (version `1.24+`)
*   **Function**: Configure as a reverse proxy forwarding PHP requests to `php-fpm` (Port 9000 or UNIX socket) and serving Vite-compiled static assets directly from the `public/build/` directory with caching headers.
*   **Rewrite Rules**: Must support standard Laravel SPA index redirections (`try_files $uri $uri/ /index.php?$query_string`).

### 2.4 Process Manager (Supervisor)
*   **Daemon Manager**: `Supervisor` (version `4.x+`)
*   **Daemons to Manage**:
    *   `php artisan horizon`: Keeps Laravel Horizon queue workers running constantly.
    *   `php artisan schedule:run`: Runs the system task scheduler every minute via system cron.

---

## 3. Database & Caching Specifications

The application separates transactional data storage from temporary state, queueing, and caching.

### 3.1 Relational Database Management System (RDBMS)
*   **Engine**: `MySQL 8.0+`
*   **Engine Configuration**: InnoDB engine must be enabled.
*   **Collation**: `utf8mb4_unicode_ci`
*   **Key Database Features Utilized**:
    *   Foreign Key integrity checks (`ON DELETE CASCADE` / `RESTRICT`)
    *   Index optimization (indexes on foreign keys, composite indexes on high-frequency tables)
    *   Soft deletes (`deleted_at` timestamps on critical records)
*   **Access Rules**: The database must sit behind a firewall, accessible only by the PHP application server (same host or VPC). Public access must be disabled.

### 3.2 Key-Value Cache & Queue Store
*   **Engine**: `Redis 7.0+`
*   **Purpose**: 
    *   **Queue Driver**: Laravel Horizon manages queued tasks (PDF generation, asynchronous notification dispatch, database backups) using Redis as the backend queue store.
    *   **Cache Store**: Caching high-frequency queries (e.g., doctor slots, ward configurations).
    *   **Session Store**: Handling stateless user sessions.
*   **Access Rules**: Must be restricted to local/VPC access with standard authentication enabled.

---

## 4. Hardware Sizing Recommendations

Depending on the hospital size, active staff, and daily patient traffic, we recommend one of the following hardware profiles. All values represent dedicated virtual resources.

### Sizing Grid

| Metric | Development / Staging | Production — Small Tier<br>*(Local Clinic / Small Hospital)* | Production — Medium Tier<br>*(General Hospital / Medium Traffic)* | Production — Large Tier<br>*(Enterprise / Multi-Facility)* |
| :--- | :--- | :--- | :--- | :--- |
| **Concurrent Users** | < 10 | 10 – 50 | 50 – 200 | 200 – 1000+ |
| **Daily Appointments** | N/A | < 100 | 100 – 500 | 500 – 2500+ |
| **Virtual CPU (vCPU)** | 1 Core | 2 Cores (Dedicated) | 4 Cores (Dedicated) | 8+ Cores (Scale-out) |
| **System RAM** | 2 GB | 4 GB | 8 GB | 16 GB+ |
| **Storage Type** | Standard SSD | NVMe SSD (High IOPS) | NVMe SSD (High IOPS) | NVMe SSD (High IOPS) |
| **Disk Capacity** | 20 GB | 50 GB | 100 GB | 250 GB+ |
| **Network Port** | 100 Mbps | 1 Gbps | 1 Gbps | 10 Gbps / Load Balanced |
| **Architecture** | Single Instance | Single Instance | Separated DB (optional) | Separated App, DB, & Cache |

> [!TIP]
> **Disk Space Considerations**: Hospital systems store files (e.g., lab result PDFs, scanned attachments). While the database size grows slowly, document storage will grow over time. We recommend offloading media storage to an S3-compatible cloud storage block (see Section 6).

---

## 5. Security & Authentication Requirements

The application processes sensitive medical records. Hosting providers must support or configure the following security protocols:

*   **SSL/TLS Protocol**: Support for HTTPS (TLS 1.2 or TLS 1.3). Automatic certificate provisioning via Let's Encrypt (Certbot integration) is required.
*   **Firewall Configuration**:
    *   **Public Open Ports**: Port 80 (HTTP, auto-redirect to 443) and Port 443 (HTTPS).
    *   **Restricted Ports**: Port 22 (SSH) must be restricted to specific developer IPs or VPN access. Port 3306 (MySQL) and Port 6379 (Redis) must never be publicly exposed.
*   **Private/Public Storage Separation**:
    *   The web root must point strictly to `/hms/public`. All PHP source files, configuration files, and system logs must reside outside the web directory.
    *   Uploaded files (e.g., patient lab results) must be stored in a **private directory** (`storage/app/private/lab-results/`). These must never be directly downloadable via static web URLs. The application generates **short-lived temporary signed URLs** via Laravel to authorize access for doctors and patients.
*   **Database Backup Policy**:
    *   Hosting configuration must allow daily cron jobs to run backups using `mysqldump` and transmit them to external, encrypted backup storage.

---

## 6. Networking & API Integration Requirements

*   **API Routing**: Supports cross-origin requests. The API router checks requests against `SANCTUM_STATEFUL_DOMAINS` to authenticate Single Page Application requests securely.
*   **Realtime Channels (WebSockets)**:
    *   The frontend utilizes Laravel Echo and Pusher client. 
    *   The network must support connections to external WebSockets (e.g., `Pusher Channels` cloud API) or run a local WebSocket server (such as Laravel Reverb or Soketi) requiring port forwarding for custom WebSocket ports (usually port `6001` or `8080`).
*   **Mail Routing (SMTP)**:
    *   The server must allow outbound TCP traffic on mail ports (`587` or `465`) to connect to an external transactional email provider (such as Amazon SES, SendGrid, Mailgun, or Mailtrap). Outbound Port `25` is usually blocked by default, which is acceptable since we use secure SMTP TLS ports.

---

## 7. Scalability & Performance Tuning

For systems projecting growth, the hosting architecture must support horizontal scaling:

1.  **Application Tier Separation**: The Laravel PHP-FPM Nginx container can be duplicated behind a load balancer (e.g., AWS ALB, Nginx Load Balancer, Cloudflare).
2.  **Database Tier Separation**: The database can be moved to a managed relational database service (e.g., AWS RDS MySQL, Google Cloud SQL) with automatic backups, point-in-time recovery (PITR), and read replicas for analytics queries.
3.  **Cache/Queue Tier Separation**: Move Redis to a dedicated node (e.g., AWS ElastiCache, Redis Enterprise) so queue processing doesn't steal CPU cycles from frontend web requests.
4.  **Static & Upload Storage**: Configure the Laravel filesystem to use an **S3-compatible bucket** (AWS S3, DigitalOcean Spaces, MinIO) instead of local disk storage for persistent uploads. This makes the application servers completely stateless.

---

## Summary for Hosting Providers

To recommend a setup, please configure an environment with the following specifications:
*   **OS**: Ubuntu Server 22.04 LTS or 24.04 LTS
*   **Engine**: Docker & Docker Compose pre-installed, OR a virtual instance with PHP 8.3-FPM, MySQL 8.0, Redis 7.0, Nginx, and Supervisor.
*   **Security**: Port 80/443 open with Let's Encrypt SSL configured. DB and Cache ports blocked from public access.
*   **Outbound Network**: Port 443 (for Pusher/external APIs) and SMTP ports (587/465) open.
*   **Resource Tier**: Recommend a suitable configuration (CPU/RAM/Storage) matching the target hospital sizing tier defined in **Section 4**.
