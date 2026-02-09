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

#### Using the Backup Script
We provide a utility script to create a compressed backup of the uploads folder.

1.  Navigate to the project root or scripts directory.
2.  Run the script:
    ```bash
    ./scripts/backup-uploads.sh
    ```
3.  Backups will be stored in the `server/backups` directory with a timestamp (e.g., `uploads_backup_20240209_120000.tar.gz`).

#### Automated Backups (Cron Job)
You can set up a cron job to run this script daily:
```bash
0 3 * * * /path/to/project/server/scripts/backup-uploads.sh
```

### Security Note
Ensure the `uploads` directory does not contain script files (e.g., `.php`, `.js`, `.sh`) if the server is configured to execute them. The application handles file validation, but server-level configuration (e.g., Nginx) should also block execution in this directory.
