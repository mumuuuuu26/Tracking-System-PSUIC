#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.env.production"
  set +a
elif [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.env"
  set +a
fi

UPLOAD_DIR_RAW="${UPLOAD_DIR:-uploads}"
if [[ "$UPLOAD_DIR_RAW" = /* ]]; then
  SOURCE_DIR="$UPLOAD_DIR_RAW"
else
  SOURCE_DIR="$PROJECT_ROOT/$UPLOAD_DIR_RAW"
fi

BACKUP_DIR="${UPLOAD_BACKUP_DIR:-$PROJECT_ROOT/backups/uploads}"
RETENTION_DAYS="${UPLOAD_BACKUP_RETENTION_DAYS:-14}"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_NAME="uploads_backup_${TIMESTAMP}.tar.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "❌ Upload directory not found: $SOURCE_DIR"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting uploads backup..."
echo "Source: $SOURCE_DIR"
echo "Target: $BACKUP_PATH"

tar -czf "$BACKUP_PATH" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

echo "✅ Upload backup completed: $BACKUP_PATH"

if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "Applying retention policy: keep ${RETENTION_DAYS} days"
  find "$BACKUP_DIR" -type f -name "uploads_backup_*.tar.gz" -mtime +"$RETENTION_DAYS" -print -delete
else
  echo "⚠️ Skip retention cleanup because UPLOAD_BACKUP_RETENTION_DAYS is not numeric: $RETENTION_DAYS"
fi
