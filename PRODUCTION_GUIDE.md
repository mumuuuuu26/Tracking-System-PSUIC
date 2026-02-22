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

### Database
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | DB Connection String | `mysql://root:password@localhost:3306/tracking_system` |

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

Before restart/update in production, run:
```bash
npm run preflight:prod
```
This validates required env keys and checks DB connectivity before migration/restart.

---

## 5. Maintenance & Troubleshooting

### Updating the System
Use the provided deployment scripts:
-   **Windows**: Double-click `scripts/deploy.bat`
-   **Linux/Mac**: Run `./scripts/deploy.sh`

### Common Issues

**1. "Database connection failed"**
-   **Check**: Is MySQL service running? (`services.msc` on Windows)
-   **Check**: Are credentials in `.env.production` correct?
-   **Check**: Is firewall blocking port 3306?

**2. "Google Calendar Sync Error"**
-   **Check**: confirm `GOOGLE_PRIVATE_KEY` in `.env.production` is enclosed in quotes `"..."` and has `\n` for newlines.
-   **Check**: confirm the service account email has "Make Changes" permission on the target Google Calendar.

**3. "Disk Full"**
-   Logs are automatically rotated and kept for 30 days (`logs/`).
-   Backups are kept for 7 days (`backups/`).
-   Check `uploads/` folder if users are uploading massive images.

**4. "Server not responding"**
-   Run `pm2 status` to see if app is running.
-   Run `pm2 logs` to see real-time error messages.
