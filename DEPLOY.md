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
5.  **Environment Variables (.env)**: Ensure the `.env` file exists in the project root with correct credentials.

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

---

## 🔍 What the Script Does automatically
1.  **`git pull`**: Updates code from the repository.
2.  **`npm install`**: Installs new dependencies (if any).
3.  **`npx prisma migrate deploy`**: Updates database schema safely.
4.  **`npx prisma generate`**: Refreshes the database client.
5.  **`pm2 restart`**: Restarts the server to apply changes.

---

## ⚠️ Troubleshooting

### 1. "Permission Denied" (Linux/Mac)
If the script won't run, give it permission:
```bash
chmod +x scripts/deploy.sh
```

### 2. "Git Conflict" or "Merge Error"
This happens if you modified files directly on the server.
**Solution:** Discard server changes (matches the repo):
```bash
git reset --hard
git pull
```

### 3. Database Connection Failed
Check your `.env` file:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
```
Ensure the MySQL service is running.

### 4. PM2 Service Not Found
If PM2 doesn't restart, start it manually:
```bash
pm2 start ecosystem.config.js
pm2 save
```
