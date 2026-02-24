# Production Guide & System Documentation

This document serves as the "Runbook" for the Tracking System. It contains everything needed to install, configure, and maintain the system in a production environment.

---

## 1. System Requirements

Before installing, ensure the server (Windows Server / Linux / Mac) meets these requirements:

-   **Node.js**: v18.17.0 (LTS) or higher
-   **Database**: MySQL 8.0 or PostgreSQL 14+ (System designed for MySQL)
-   **Process Manager**: PM2 (Global install)
-   **Git**: For version control updates
-   **Reverse Proxy**: Nginx or IIS (Optional but recommended for SSL)

---

## 2. Environment Configuration (.env.production)

Create a `.env.production` file in the root directory. **Do not commit this file to Git.**

### Server & Security
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Port for the backend API | `5002` |
| `SECRET` | Secret key for JWT Token generation | `my_super_secure_secret_key` |
| `NODE_ENV` | Environment mode | `production` |
| `CLIENT_URL` | URL of the Frontend (CORS Policy) | `http://10.135.2.243` |
| `FRONTEND_URL` | Used in email links | `http://10.135.2.243` |
| `HTTPS_ONLY` | Force app to accept HTTPS only (optional) | `false` |
| `ENABLE_HTTPS_HEADERS` | Enable HSTS/CSP upgrade headers (optional) | `false` |
| `TRUST_PROXY` | Trust reverse-proxy HTTPS headers | `1` |
| `TLS_KEY_FILE` | TLS private key path (Node native TLS) | `/etc/ssl/private/app.key` |
| `TLS_CERT_FILE` | TLS certificate path (Node native TLS) | `/etc/ssl/certs/app.crt` |

### Database
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | DB Connection String | `mysql://root:password@localhost:3306/tracking_system` |

### Uploads & Retention
| Variable | Description | Example |
| :--- | :--- | :--- |
| `UPLOAD_DIR` | Absolute persistent path for uploaded files | `/srv/psuic/uploads` |
| `UPLOAD_ALLOWED_MIME` | Allowed image MIME list | `image/jpeg,image/png,image/webp` |
| `UPLOAD_MAX_BYTES` | Max input image size per file | `5242880` |
| `UPLOAD_MAX_WIDTH` | Max image width (if `sharp` available) | `1920` |
| `UPLOAD_MAX_HEIGHT` | Max image height (if `sharp` available) | `1920` |
| `UPLOAD_QUALITY` | Output quality 1-100 (if `sharp` available) | `82` |
| `UPLOAD_TARGET_FORMAT` | `webp`, `jpeg`, `png`, or `original` | `webp` |
| `UPLOAD_BACKUP_DIR` | Absolute persistent path for upload backups | `/srv/psuic/backups/uploads` |
| `UPLOAD_BACKUP_MODE` | Upload backup strategy: `incremental` or `differential` | `incremental` |
| `UPLOAD_BACKUP_FULL_INTERVAL_DAYS` | Differential mode only: create new full baseline every N days (`0` = disable auto refresh) | `7` |
| `UPLOAD_BACKUP_RETENTION_DAYS` | Keep upload backups for N days | `14` |
| `UPLOAD_ORPHAN_RETENTION_HOURS` | Keep unreferenced upload files for N hours before delete | `24` |
| `DB_BACKUP_CRON` | Cron for DB backup job | `"0 3 * * *"` |
| `UPLOAD_BACKUP_CRON` | Cron for upload backup job | `"20 3 * * *"` |
| `OFFSITE_BACKUP_DIR` | Optional absolute path for offsite mirror backup (SMB/NAS/another disk) | `D:/offsite/tracking-backups` |
| `OFFSITE_BACKUP_RETENTION_DAYS` | Retention of mirrored backups | `30` |
| `OFFSITE_BACKUP_CRON` | Cron for offsite mirror sync | `"40 3 * * *"` |
| `UPLOAD_CLEANUP_CRON` | Cron for upload orphan cleanup job | `"50 3 * * *"` |
| `LOG_ROTATE_MAX_MB` | Rotate `out.log`/`error.log`/PM2 logs when file exceeds this size | `20` |
| `LOG_RETENTION_DAYS` | Keep rotated log archives for N days | `14` |
| `LOG_ROTATE_CRON` | Cron for runtime log rotation | `"15 * * * *"` |
| `GOOGLE_SYNC_MIN_INTERVAL_MS` | Minimum interval between sync calls per user | `300000` |

### Email Notifications (SMTP)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `MAIL_USER` | Gmail address | `psuic.helpdesk@gmail.com` |
| `MAIL_PASS` | Gmail App Password (Not Login Pwd) | `xxxx xxxx xxxx xxxx` |

### Integrations (Google Calendar)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `GOOGLE_PROJECT_ID` | GCP Project ID | `vocal-raceway-xxx` |
| `GOOGLE_CLIENT_EMAIL` | Service Account Email | `service@...com` |
| `GOOGLE_CALENDAR_ID` | Default Calendar to sync | `my_calendar@gmail.com` |
| `GOOGLE_PRIVATE_KEY` | Service Account Key (PEM) | `"-----BEGIN PRIVATE KEY...\n..."` (Must use quotes and \n) |

---

## 3. Database Structure (ER Diagram)

The system uses **Prisma ORM**. Below is the entity relationship diagram.

```mermaid
erDiagram
    User ||--o{ Ticket : "creates"
    User ||--o{ Ticket : "assigned_to"
    User ||--o{ ActivityLog : "performs"
    User ||--o{ Notification : "receives"
    User ||--o{ PersonalTask : "owns"

    Ticket ||--|| Room : "located_in"
    Ticket ||--o| Equipment : "involves"
    Ticket ||--o| Category : "classified_as"
    Ticket ||--o{ ActivityLog : "has_history"
    Ticket ||--o{ Image : "has_photos"
    Ticket ||--o{ Notification : "triggers"

    Room ||--o{ Equipment : "contains"

    User {
        int id
        string username
        string email
        string role "user, it_support, admin"
        string department
    }

    Ticket {
        int id
        string title
        string status "not_start, in_progress, completed"
        string urgency "Normal, High, Critical"
        int rating "SUS Score 0-100"
    }

    ActivityLog {
        int id
        string action
        string detail
    }
```

---

## 4. Installation Guide (From Scratch)

### Step 1: Install Dependencies
Install Node.js (LTS), Git, and MySQL Server on the machine.

### Step 2: Clone & Setup Project
```bash
# 1. Clone repository
git clone https://github.com/mumuuuuu26/projectbanklangpalm.git
cd projectbanklangpalm

# 2. Install Backend Dependencies
npm install
npm install -g pm2

# 3. Install & Build Frontend
cd client
npm install
npm run build
cd ..

# 4. Setup .env.production
cp .env.production.example .env.production
# (Edit .env.production with your credentials)
```

### Step 3: Database Setup
```bash
# 1. Create MySQL Database (if not exists)
# Log into MySQL and run: CREATE DATABASE tracking_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Run Migrations (Create Tables)
npm run prisma:migrate:prod

# 3. Seed Initial Data (Admin User, Rooms, Categories)
npm run seed
```

### Step 4: Start Server
```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 list to resurrect on reboot
pm2 save
pm2 startup
```

On Windows, configure reboot restore task once (run as Administrator):
```bat
windows-enable-pm2-startup.bat
```

Before restart/update in production, run:
```bash
npm run preflight:prod
```
This validates required env keys, checks DB connectivity, and verifies upload storage write permissions before migration/restart.

---

## 5. Maintenance & Troubleshooting

### Updating the System
Use the provided deployment scripts:
-   **Windows**: Run `windows-deploy.bat` in `C:\xampp\htdocs\app\server`
-   **Linux/Mac**: Follow your platform deploy script/runbook

### One-Step Data Cutover (Local DB -> Server DB, Windows)
Run in `C:\xampp\htdocs\app\server`:
```bat
windows-cutover-prod.bat
```
This script imports SQL dump, updates `.env.production` to use server MySQL, runs deploy, and executes runtime checks.

### Common Issues

**1. "Database connection failed"**
-   **Check**: Is MySQL service running? (`services.msc` on Windows)
-   **Check**: Are credentials in `.env.production` correct?
-   **Check**: Is firewall blocking port 3306?

**2. "Google Calendar Sync Error"**
-   **Check**: confirm `GOOGLE_PRIVATE_KEY` in `.env.production` is enclosed in quotes `"..."` and has `\n` for newlines.
-   **Check**: confirm the service account email has "Make Changes" permission on the target Google Calendar.

**3. "Disk Full"**
-   Runtime logs (`logs/out.log`, `logs/error.log`, PM2 logs) are rotated by scheduler (`LOG_ROTATE_*`).
-   DB backups are kept for 7 days (`backups/`).
-   Upload backups run as incremental/differential snapshots (not full copy every day), and are kept by `UPLOAD_BACKUP_RETENTION_DAYS` (default 14 days).
-   Optional offsite backup mirror runs when `OFFSITE_BACKUP_DIR` is configured.
-   Orphan upload files are cleaned by scheduler (`npm run uploads:cleanup`).
-   Manual maintenance commands:
    - `npm run logs:rotate`
    - `npm run uploads:backup`
    - `npm run backup:offsite`
    - `npm run uploads:cleanup`
    - `npm run uploads:migrate:room-images` (one-time migration for old Room base64 images)

**4. "Server not responding"**
-   Run `pm2 status` to see if app is running.
-   Run `pm2 logs` to see real-time error messages.

**5. "prisma generate failed (binaries.prisma.sh / cert chain / firewall redirect)"**
-   Production deploy now uses SQL migration mode (`npm run migrate:sql:prod`) and does **not** call `prisma migrate deploy` on server.
-   `scripts/prisma-generate-safe.js` runs in offline-safe mode by default and validates existing generated client without downloading Prisma engines.
-   If schema changed and server cannot reach Prisma binaries, generate client on a machine with internet and upload `node_modules/.prisma/client` to the server, then rerun deploy.
