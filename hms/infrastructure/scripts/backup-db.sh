#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
BACKUP_DIR="/var/backups/hms/db"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_FILE="$BACKUP_DIR/hms_db_$TIMESTAMP.sql.gz"
S3_BUCKET="s3://hms-backups-bucket/db"
DB_CONTAINER_NAME="hms-mysql-1" # Or the exact container name in docker-compose.prod.yml

# Create local backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "============================================="
echo " Starting HMS Database Backup..."
echo "============================================="

# 1. Dump database from Docker MySQL container and compress
echo "Creating SQL dump and compressing..."
# If password needs to be read from env, it can be passed or hardcoded
docker exec "$DB_CONTAINER_NAME" mysqldump -u hms_admin -psecureproductionpassword123 hms | gzip > "$BACKUP_FILE"

# 2. Upload to S3 using AWS CLI
echo "Uploading backup file to S3..."
if command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_FILE" "$S3_BUCKET/hms_db_$TIMESTAMP.sql.gz"
    echo "S3 Upload completed."
else
    echo "WARNING: AWS CLI not installed. Backup stored locally at $BACKUP_FILE."
fi

# 3. Retention policy: clean up files older than 7 days locally
echo "Cleaning up local backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete

echo "============================================="
echo " Database Backup Process Finished! ✅"
echo "============================================="
