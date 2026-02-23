# IT Tracking System Server

This is the backend server for the IT Tracking System, built with Node.js, Express, and Prisma (MySQL).

## Prerequisites

Before running the project, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 recommended)
- **PM2** (Process Manager, installed globally: `npm install pm2 -g`)

## Installation

1.  **Clone the repository** (if not already done).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    - Local/Dev: use `.env`
    - Production: use `.env.production` (copy from `.env.production.example`)

## Configuration (.env)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Server port | `5002` |
| `SECRET` | JWT Secret Key | `your_secret_key` |
| `CLIENT_URL` | Frontend URL for CORS | `https://localhost:5173` |
| `DATABASE_URL` | MySQL Connection String | `mysql://user:pass@localhost:3306/db_name` |
| `MAIL_USER` | Email for sending notifications | `example@gmail.com` |
| `MAIL_PASS` | Email App Password | `xxxx xxxx xxxx xxxx` |
| `GOOGLE_PROJECT_ID` | Google Cloud Project ID | `your-project-id` |
| `GOOGLE_CLIENT_EMAIL`| Service Account Email | `service@project.iam.gserviceaccount.com` |
| `GOOGLE_CALENDAR_ID` | Calendar ID to sync | `primary` or `email@gmail.com` |
| `GOOGLE_PRIVATE_KEY` | Service Account Key | `-----BEGIN PRIVATE KEY-----\n...` |

## Database Setup

Initialize the database schema using Prisma:

```bash
# Push schema to DB (Development/Prototyping)
npx prisma db push

# Apply migrations (Production)
npm run prisma:migrate:prod
```

To seed initial data:
```bash
npm run seed
```

## Running the Server

### Development
Runs with `nodemon` for auto-reload.
```bash
npm run dev
```

### Development (HTTPS only)
Generate local TLS cert + enable HTTPS-only config:
```bash
npm run https:setup
npm run dev
```
Health check:
```bash
curl -k https://localhost:5002/health
```

### Production (PM2)
We use **PM2** to manage the process in production.

**Start the server:**
```bash
pm2 start ecosystem.config.js --env production
```

**Management Commands:**
- Check status: `pm2 status`
- View logs: `pm2 logs tracking-system`
- Restart: `pm2 restart tracking-system`
- Stop: `pm2 stop tracking-system`

**Log Files:**
- Logs are written to the `./logs/` directory.

## Logging

The application uses **Winston** for robust logging. Logs are automatically rotated daily and stored in the `logs/` directory.

- **Error Logs**: `logs/error/YYYY-MM-DD.log` - Contains only error-level messages (useful for debugging).
- **Combined Logs**: `logs/YYYY-MM-DD.log` - Contains all log levels (info, warn, error).

These files are excluded from version control (`.gitignore`).

## Test Strategy

- **CI Pipeline**: Runs backend tests, smoke tests, frontend tests, and Playwright E2E.
- **E2E Tests**: Playwright tests are available for local and CI execution.
  - Run E2E locally: `npm run test:e2e`

## Performance & Load Testing

- **Tool**: k6
- **Load Profile**: 100 concurrent users
- **Result**:
  - Success rate: 100%
  - p95 response time: < 3ms
- **Rate Limiting**: Configured to support real-world usage (3000 req/15min).

### Run locally:
```bash
k6 run tests/load/load-test.js
```

## API Documentation

Swagger UI is available at:
`https://localhost:5002/api-docs` (when HTTPS is enabled)
(Make sure the server is running)

## Security Features
- **Input Validation**: Uses `zod` to validate critical inputs.
- **Error Handling**: Centralized error logging and safe responses.
- **Data Integrity**: Soft Delete implemented for Tickets.

## Troubleshooting

### Server Won't Start (`npm start` fails)
- **Port Conflict**: Check if port `5002` is already in use. You can change it in `.env`.
- **Node Modules**: Ensure you have run `npm install` successfully.
- **Environment Variables**: Verify that your `.env` file exists and has valid values.

### Database Connection Failed
- **MySQL Service**: Ensure your MySQL server service is running.
- **Credentials**: Double-check `DATABASE_URL` in `.env`. The format should be `mysql://user:password@host:port/database`.
- **Network**: Ensure firewall is not blocking port `3306` (or your DB port).

### Where are the logs?
- **Location**: All logs are stored in the `./logs/` directory.
- **Error Logs**: See `./logs/error/`.
- **Combined Logs**: See `./logs/`.
- Logs are rotated daily.
