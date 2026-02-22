# Deployment Guide

## File Upload Persistence & Backup

### Storing Uploads
The application stores user-uploaded images in the `server/uploads` directory.
- **Development**: These files are stored locally in the project folder.
- **Production**:
  - **Do NOT** rely on the container's filesystem if using Docker/Kubernetes, as data will be lost on redeploy.
  - **MUST** mount a persistent volume to `/app/uploads` (or wherever the app runs).

### Backup Strategy
To prevent data loss, regular backups of the `uploads` directory are essential.

#### Using the Backup Script (Recommended)
Use the Node.js backup script (`cross-platform`) with retention cleanup.

1.  Navigate to the project root or scripts directory.
2.  Run the script:
    ```bash
    npm run uploads:backup
    ```
3.  Backups will be stored in `server/backups/uploads` with a timestamp folder name.
4.  Old backups are removed automatically based on `UPLOAD_BACKUP_RETENTION_DAYS` (default: 14 days).

#### Optional Archive Backup
If you need a `.tar.gz` archive backup:
```bash
npm run uploads:backup:archive
```

#### Automated Backups & Cleanup (Cron)
The app scheduler runs these jobs automatically (production mode):
- `DB_BACKUP_CRON` (default `0 3 * * *`)
- `UPLOAD_BACKUP_CRON` (default `20 3 * * *`)
- `UPLOAD_CLEANUP_CRON` (default `50 3 * * *`)

You can also run orphan cleanup manually:
```bash
npm run uploads:cleanup
```

Orphan cleanup will remove files in `uploads/` that are no longer referenced by DB (`User.picture`, `Room.imageUrl`, `Image.url/secure_url`) after `UPLOAD_ORPHAN_RETENTION_HOURS`.

If your old `Room.imageUrl` data still stores base64, run one-time migration:
```bash
npm run uploads:migrate:room-images
```

### Security Note
Ensure the `uploads` directory does not contain script files (e.g., `.php`, `.js`, `.sh`) if the server is configured to execute them. The application handles file validation, but server-level configuration (e.g., Nginx) should also block execution in this directory.
