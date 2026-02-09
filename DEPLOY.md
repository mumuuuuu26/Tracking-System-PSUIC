# Deployment Guide

This guide explains how to use the automated deployment scripts to update the server.

## Prerequisites

1.  **Git**: Must be installed and authenticated to pull from the repository.
2.  **Node.js & npm**: Must be installed.
3.  **PM2**: Must be installed globally (`npm install -g pm2`).
4.  **Database**: Must be running and accessible.

## One-Click Deployment

### option 1: Windows Server (Command Prompt)
1.  Remote Desktop into the server.
2.  Navigate to the project directory.
3.  Double-click `scripts/deploy.bat`.
    *   Alternatively, run `.\scripts\deploy.bat` in Command Prompt.

### Option 2: Linux / Mac / Git Bash
1.  SSH into the server.
2.  Navigate to the project directory.
3.  Run the deploy script:
    ```bash
    ./scripts/deploy.sh
    ```

## What the Script Does

1.  **`git pull`**: Downloads the latest code from the repository.
2.  **`npm install`**: Installs any new dependencies.
3.  **`npx prisma migrate deploy`**: Applies pending database migrations.
4.  **`npx prisma generate`**: Regenerates the Prisma Client.
5.  **`pm2 restart ...`**: Reloads the application with zero downtime (if configured) or fast restart.

## Troubleshooting

-   **Git Conflict**: If you edited files correctly on the server, `git pull` might fail. Revert server-side changes or stash them (`git stash`) before deploying.
-   **Permission Denied**: On Linux/Mac, ensure the script is executable: `chmod +x scripts/deploy.sh`.
