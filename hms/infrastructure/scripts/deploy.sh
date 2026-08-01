#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Navigate to application folder on server
PROJECT_DIR="/var/www/html/hms"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    cd "/home/ubuntu/hms"
fi

echo "============================================="
echo " Starting HMS zero-downtime deployment..."
echo "============================================="

# 1. Pull latest code from Git
echo "Fetching latest changes..."
git pull origin main

# 2. Rebuild and run Docker Compose Production
echo "Building and restarting Docker containers..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# 3. Perform backend database updates and caches inside container
echo "Running Laravel artisan routines..."
# Run migrations with force flag
docker compose -f docker-compose.prod.yml exec -T php php artisan migrate --force

# Create configuration cache, route cache, view cache
docker compose -f docker-compose.prod.yml exec -T php php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T php php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T php php artisan view:cache
docker compose -f docker-compose.prod.yml exec -T php php artisan storage:link

# 4. Restart Horizon / Queue workers managed by Supervisor
echo "Restarting queue workers..."
docker compose -f docker-compose.prod.yml exec -T supervisor supervisorctl restart all

echo "============================================="
echo " HMS Deployment successfully completed! 🚀"
echo "============================================="
