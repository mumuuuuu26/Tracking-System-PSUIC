# Deployment Guide

This guide explains how to deploy the **IT Support & Asset Tracking System** to the production server.

## 🛠 Prerequisites

Before running the deployment script, ensure the server has the following installed:

1.  **Git**: Used to pull the latest code.
    - Verify: `git --version`
2.  **Node.js (v18+) & npm**: Framework backend.
    - Verify: `node -v`
3.  **PM2**: Process manager to keep the app running.
    - Install: `npm install -g pm2`
4.  **Database (MySQL)**: Must be running and accessible.
5.  **Environment Variables (.env.production)**: Ensure `.env.production` exists in the project root with correct credentials.
   - `UPLOAD_DIR` and `UPLOAD_BACKUP_DIR` must be absolute persistent paths (example `/srv/psuic/uploads` and `/srv/psuic/backups/uploads`).
6.  **Network Access**: Target host `10.135.2.226` is private network (องค์กร/มหาวิทยาลัย). Deploy machine must be on university network or VPN.

---

## 🚀 One-Click Deployment

### Option A: Windows Server
1.  Remote Desktop into the server.
2.  Open **Command Prompt** or **PowerShell**.
3.  Navigate to the project folder:
    ```cmd
    cd C:\path\to\project
    ```
4.  Run the deployment script:
    ```cmd
    scripts\deploy.bat
    ```

### Option B: Linux / macOS / Git Bash
1.  SSH into the server.
2.  Navigate to the project directory.
3.  Run the script:
    ```bash
    ./scripts/deploy.sh
    ```

Before first deploy, prepare persistent upload directories and permissions for PM2 user:
```bash
sudo mkdir -p /srv/psuic/uploads /srv/psuic/backups/uploads
sudo chown -R $USER:$USER /srv/psuic/uploads /srv/psuic/backups/uploads
sudo chmod 750 /srv/psuic/uploads /srv/psuic/backups/uploads
```

---

## 🔍 What the Script Does automatically
1.  **`git pull`**: Updates code from the repository.
2.  **`npm install`**: Installs new dependencies (if any).
3.  **`npm run preflight:prod`**: Validates production env + checks DB + verifies upload storage write permissions.
4.  **`npm run prisma:migrate:prod`**: Updates database schema safely using production env.
5.  **`npm run prisma:generate:prod`**: Refreshes the database client using production env.
6.  **`pm2 restart`**: Restarts the server to apply changes.
7.  Deployment stops immediately if any preflight/migration step fails.

After deployment, upload maintenance jobs run automatically via scheduler in production mode:
- `DB_BACKUP_CRON` (default `0 3 * * *`)
- `UPLOAD_BACKUP_CRON` (default `20 3 * * *`)
- `UPLOAD_CLEANUP_CRON` (default `50 3 * * *`)

---

## ⚠️ Troubleshooting

### 1. "Permission Denied" (Linux/Mac)
If the script won't run, give it permission:
```bash
chmod +x scripts/deploy.sh
```

### 2. "Git Conflict" or "Merge Error"
This happens if you modified files directly on the server.
**Solution:** Commit or stash local changes first, then pull again:
```bash
git status
git stash
git pull
```

### 3. Database Connection Failed
Check your `.env.production` file:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
```
Ensure the MySQL service is running.

### 4. PM2 Service Not Found
If PM2 doesn't restart, start it manually:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```
