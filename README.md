# IT Tracking System Server

Backend API for PSUIC IT Tracking System.
Built with Node.js + Express + Prisma (MySQL), with PM2 production runtime, CI guards, and E2E selector contracts.

## Tech Stack

- Node.js (CommonJS)
- Express 5
- Prisma + MySQL
- JWT auth
- Winston logging
- PM2 process management
- Playwright + Jest test suite

## Runtime Requirements (Important)

This repository is now pinned to CI runtime:

- Node.js: `20.x`
- npm: `10.x`

Enforced by:

- `.nvmrc` (root + client)
- `engines` + `packageManager` in `package.json`
- `preinstall` runtime guard (`npm install`/`npm ci` fail fast on wrong runtime)

Use:

```bash
nvm use
npm --version
node --version
```

## Project Structure

- Backend root: this repository root
- Frontend: `client/`
- Prisma schema: `prisma/`
- Runtime scripts: `scripts/`
- CI workflow: `.github/workflows/ci.yml`

## Environment Files

- Local dev template: `.env.example`
- Production template: `.env.production.example`
- Production runtime file: `.env.production`

### Minimum Required Variables

- `SECRET`
- `DATABASE_URL`
- `CLIENT_URL`
- `FRONTEND_URL`

### Optional but Common

- SMTP: `MAIL_USER`, `MAIL_PASS`
- Google Calendar sync: `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_CALENDAR_ID`, `GOOGLE_PRIVATE_KEY`
- Upload/backup/log rotation controls (see `.env.production.example`)

## Installation

### 1) Install dependencies

```bash
npm ci
cd client && npm ci
cd ..
```

### 2) Prisma generate

```bash
npx prisma generate
```

### 3) Development DB setup

```bash
npx prisma db push
npm run seed
```

## Development Run

Backend only:

```bash
npm run dev
```

Backend + frontend:

```bash
npm run dev:full
```

HTTPS local setup:

```bash
npm run https:setup
npm run dev
```

Health check:

```bash
curl -k https://localhost:5002/health
```

## Production Run (PM2)

PM2 app name used by this repo:

- `tracking-system-backend`

Start:

```bash
pm2 start ecosystem.config.js --env production
```

Common commands:

```bash
pm2 status
pm2 logs tracking-system-backend
pm2 restart tracking-system-backend --update-env
pm2 stop tracking-system-backend
pm2 save
```

## Windows Production Deploy

Primary deploy script:

```bat
windows-deploy.bat
```

Runtime verify script:

```bat
windows-runtime-check.bat
```

Auto-start PM2 task setup:

```bat
windows-enable-pm2-startup.bat
```

This creates/updates scheduled task:

- `TrackingSystem-PM2-Resurrect`

## Lockfile + CI Guard Rails

If `package.json` changes, lockfiles must be regenerated with npm 10.

Checks:

```bash
npm run guard:runtime:strict
npm run guard:lockfile:npm10
```

Regenerate lockfiles safely:

```bash
npm run guard:update-lockfile:npm10
```

## Database Migration / Production Preflight

Production preflight:

```bash
npm run preflight:prod
```

Apply SQL migrations (production-safe path):

```bash
npm run migrate:sql:prod
```

## Testing

Backend full tests:

```bash
npm test
```

Backend unit-only (no DB):

```bash
npm run test:unit
```

Smoke predeploy:

```bash
npm run smoke:predeploy
```

E2E:

```bash
npm run test:e2e
```

E2E selector guard:

```bash
npm run check:e2e:selectors
```

Selector guideline:

- `docs/TEST_GUIDELINES.md`

## Logs and Rotation

- PM2 stdout/stderr: `logs/out.log`, `logs/error.log`
- Additional app logs: `logs/`
- Rotation/retention is controlled by env vars and script:

```bash
npm run logs:rotate
```

## Backup Jobs

Managed by backend scheduler env controls:

- `DB_BACKUP_CRON`
- `UPLOAD_BACKUP_CRON`
- `UPLOAD_CLEANUP_CRON`
- `OFFSITE_BACKUP_CRON`

Manual helpers:

```bash
npm run uploads:backup
npm run backup:offsite
```

## API Documentation

Swagger UI:

- `http://<host>:<port>/api-docs`
- or `https://<host>:<port>/api-docs` when HTTPS is enabled

## Troubleshooting

### `npm ci` fails with lock mismatch

Run:

```bash
npm run guard:update-lockfile:npm10
```

Commit both lockfiles:

- `package-lock.json`
- `client/package-lock.json`

### Install fails on wrong Node/npm

Use the pinned runtime:

```bash
nvm use
```

Then rerun install.

### Server starts but health fails

Check:

- `PORT` in `.env.production`
- `pm2 logs tracking-system-backend`
- `windows-runtime-check.bat` (Windows)

### Google sync errors with certificate chain

If you see `self-signed certificate in certificate chain`, this is network TLS interception/proxy. Fix trust chain at OS/network level for stable production behavior.

## Security Notes

- Do not commit real `.env` / `.env.production`
- Use strong `SECRET`
- Use least-privilege DB users
- Keep npm lockfiles and runtime pinned to avoid CI drift
