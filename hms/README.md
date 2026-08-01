# Hospital Management System (HMS) — Monorepo

Welcome to the **Hospital Management System (HMS)** monorepo. This repository integrates a Laravel 12.x REST API, a React 18 SPA (Vite 7.x), shared backend modules, custom UI libraries, and full deployment/infrastructure configuration blueprints.

---

## 🏗️ Monorepo Architecture

The workspace is organized as a single repository containing:
- **Laravel Backend**: Root directories (`app/`, `config/`, `database/`, `routes/`).
- **React Frontend**: `resources/js/` (Vite, React Query, Zustand, Recharts).
- **Shared Local Packages**:
  - `packages/hms-core`: Shared PHP domain Enums (`AppointmentStatus`, `BillStatus`, etc.).
  - `packages/hms-notifications`: Shared notification channels & mail templates.
  - `packages/hms-ui`: Reusable frontend components (`StatusBadge`, `PatientCodeChip`).

---

## 🚀 Running the Project Locally

### 1. Traditional Local Development
1. Start the backend server:
   ```bash
   php artisan serve --port=8000
   ```
2. Start the frontend Vite HMR server:
   ```bash
   npm run dev
   ```

### 2. Running via Docker
- **Development**:
  ```bash
  docker-compose up -d --build
  ```
- **Production (Multi-stage build, no volume mounts)**:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  ```

---

## 🛡️ Production Deployment & Infrastructure (Week 8)

Configurations are located in the `infrastructure/` directory:

- **Terraform (IaC)**:
  Provision resources using the staging or production environment definitions:
  ```bash
  cd infrastructure/terraform/environments/production
  terraform init
  terraform plan
  terraform apply
  ```
- **Nginx Config**:
  Copy `infrastructure/nginx/hms.conf` to `/etc/nginx/sites-available/` and secure it with Certbot:
  ```bash
  sudo certbot --nginx -d your-domain.com
  ```
- **Deployment Automation**:
  Deploy updates with zero-downtime using the `deploy.sh` script:
  ```bash
  bash infrastructure/scripts/deploy.sh
  ```
- **Database Backups**:
  Run or schedule `backup-db.sh` via crontab for daily automated backups to AWS S3:
  ```bash
  bash infrastructure/scripts/backup-db.sh
  ```

---

## 🧪 Running Tests

- **Unit & Feature Tests**:
  ```bash
  php artisan test
  ```
- **E2E Browser Tests (Laravel Dusk)**:
  ```bash
  php artisan dusk
  ```

---

## 👥 Seeded Demo Accounts

Seed local database using `php artisan db:seed` to register the following predefined roles for system walkthroughs:

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin@hms.com` | `password123` |
| **Doctor** | `doctor@hms.com` | `password123` |
| **Receptionist** | `receptionist@hms.com` | `password123` |
| **Nurse** | `nurse@hms.com` | `password123` |
| **Patient** | `patient@hms.com` | `password123` |

---

## 📄 License
This project is open-source software licensed under the [MIT license](https://opensource.org/licenses/MIT).
