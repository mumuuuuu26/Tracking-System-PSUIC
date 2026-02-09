#!/bin/bash

# Configuration
SOURCE_DIR="../uploads"
BACKUP_DIR="../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="uploads_backup_$TIMESTAMP.tar.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Starting backup of $SOURCE_DIR to $BACKUP_DIR/$BACKUP_NAME..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "✅ Backup completed successfully: $BACKUP_DIR/$BACKUP_NAME"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Optional: Keep only last 7 days of backups (uncomment to enable)
# find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +7 -delete
