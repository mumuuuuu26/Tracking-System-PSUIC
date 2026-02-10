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
    Create a `.env` file in the root directory (copy from example if available, or use the reference below).

## Configuration (.env)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Server port | `5002` |
| `SECRET` | JWT Secret Key | `your_secret_key` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
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

# OR Create a migration (Production)
npx prisma migrate dev --name init
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

### Production (PM2)
We use **PM2** to manage the process in production.

**Start the server:**
```bash
pm2 start ecosystem.config.js
```

**Management Commands:**
- Check status: `pm2 status`
- View logs: `pm2 logs tracking-system`
- Restart: `pm2 restart tracking-system`
- Stop: `pm2 stop tracking-system`

**Log Files:**
- Logs are written to the `./logs/` directory.

## Test Strategy

- **CI Pipeline**: Runs Unit and Integration tests (Jest) to ensure core logic and check for regressions.
- **E2E Tests**: Playwright tests are available for local or manual execution. They are disabled in CI to prioritize build speed and stability.
  - Run E2E: `npm run test:e2e`

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
`http://localhost:5002/api-docs`
(Make sure the server is running)

## Security Features
- **Input Validation**: Uses `zod` to validate critical inputs.
- **Error Handling**: Centralized error logging and safe responses.
- **Data Integrity**: Soft Delete implemented for Tickets.
