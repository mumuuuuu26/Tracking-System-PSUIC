# IT Tracking System Server

Backend API for PSUIC IT Tracking System.

---

## Thai (TH)

### 1) ภาพรวม

ระบบนี้คือ Backend API ของโปรเจกต์ IT Tracking System พัฒนาด้วย Node.js + Express + Prisma (MySQL) และรัน production ด้วย PM2

### 2) เทคโนโลยีที่ใช้

- Node.js (CommonJS)
- Express 5
- Prisma + MySQL
- JWT
- Winston logging
- PM2
- Jest + Playwright

### 3) Runtime ที่บังคับให้ตรงกับ CI

- Node.js: `20.x`
- npm: `10.x`

มี guard บังคับไว้แล้วผ่าน:

- `.nvmrc` (ทั้ง root และ `client/`)
- `engines` + `packageManager` ใน `package.json`
- `preinstall` script (จะ fail ถ้าเวอร์ชันไม่ตรง)

คำสั่งเช็ก:

```bash
nvm use
node --version
npm --version
```

### 4) โครงสร้างโปรเจกต์

- Backend root: โฟลเดอร์นี้
- Frontend: `client/`
- Prisma schema: `prisma/`
- Scripts: `scripts/`
- CI workflow: `.github/workflows/ci.yml`

### 5) Environment files

- Dev template: `.env.example`
- Production template: `.env.production.example`
- Production runtime: `.env.production`

ค่าขั้นต่ำที่ต้องมี:

- `SECRET`
- `DATABASE_URL`
- `CLIENT_URL`
- `FRONTEND_URL`

ค่าเสริมที่ใช้บ่อย:

- SMTP: `MAIL_USER`, `MAIL_PASS`
- Google Calendar: `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_CALENDAR_ID`, `GOOGLE_PRIVATE_KEY`
- Frontend external rating form: `client/.env*` => `VITE_EXTERNAL_RATING_FORM_URL`
- Upload/backup/log rotation: ดูตัวอย่างใน `.env.production.example`

### 6) Installation

ติดตั้ง dependency:

```bash
npm ci
cd client && npm ci
cd ..
```

Generate Prisma client:

```bash
npx prisma generate
```

เตรียม DB ฝั่งพัฒนา:

```bash
npx prisma db push
npm run seed
```

### 7) Run ฝั่งพัฒนา

Backend อย่างเดียว:

```bash
npm run dev
```

Backend + Frontend:

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

### 8) Run production ด้วย PM2

ชื่อ PM2 app ที่ใช้งานจริง:

- `tracking-system-backend`

Start:

```bash
pm2 start ecosystem.config.js --env production
```

คำสั่งหลัก:

```bash
pm2 status
pm2 logs tracking-system-backend
pm2 restart tracking-system-backend --update-env
pm2 stop tracking-system-backend
pm2 save
```

### 9) Deploy บน Windows

Deploy หลัก:

```bat
windows-deploy.bat
```

ตรวจ runtime หลัง deploy:

```bat
windows-runtime-check.bat
```

ตั้ง auto-start PM2 หลัง reboot:

```bat
windows-enable-pm2-startup.bat
```

Scheduled task ที่ใช้:

- `TrackingSystem-PM2-Resurrect`

### 10) Guard ป้องกัน CI พังจาก dependency mismatch

เช็ก runtime:

```bash
npm run guard:runtime:strict
```

เช็ก lockfile ด้วย npm10:

```bash
npm run guard:lockfile:npm10
```

อัปเดต lockfile ให้ถูกต้อง (เมื่อแก้ package):

```bash
npm run guard:update-lockfile:npm10
```

### 11) Migration / Production Preflight

Preflight production:

```bash
npm run preflight:prod
```

Apply SQL migrations (production-safe):

```bash
npm run migrate:sql:prod
```

### 12) Testing

Backend tests:

```bash
npm test
```

Unit only (ไม่ใช้ DB):

```bash
npm run test:unit
```

Smoke test:

```bash
npm run smoke:predeploy
```

E2E:

```bash
npm run test:e2e
```

E2E selector contract:

```bash
npm run check:e2e:selectors
```

เอกสาร selector guideline:

- `docs/TEST_GUIDELINES.md`

### 13) Logs และ Backup

Logs หลัก:

- `logs/out.log`
- `logs/error.log`
- เพิ่มเติมในโฟลเดอร์ `logs/`

หมุน log:

```bash
npm run logs:rotate
```

Backup helpers:

```bash
npm run uploads:backup
npm run backup:offsite
```

ตั้ง cron ผ่าน env:

- `DB_BACKUP_CRON`
- `UPLOAD_BACKUP_CRON`
- `UPLOAD_CLEANUP_CRON`
- `OFFSITE_BACKUP_CRON`

### 14) API Documentation

Swagger UI:

- `http://<host>:<port>/api-docs`
- หรือ `https://<host>:<port>/api-docs` เมื่อเปิด HTTPS

### 15) Troubleshooting

`npm ci` fail เพราะ lock mismatch:

```bash
npm run guard:update-lockfile:npm10
```

แล้ว commit ทั้ง:

- `package-lock.json`
- `client/package-lock.json`

Install fail เพราะ Node/npm ไม่ตรง:

```bash
nvm use
```

Server รันแล้ว health fail:

- ตรวจ `PORT` ใน `.env.production`
- ดู `pm2 logs tracking-system-backend`
- รัน `windows-runtime-check.bat` (Windows)

Google sync เจอ `self-signed certificate in certificate chain`:

- เป็นปัญหา TLS interception/proxy ของ network
- ต้องแก้ trust chain ที่ระดับ OS/network

### 16) Security Notes

- ห้าม commit `.env` จริง / `.env.production` จริง
- ใช้ `SECRET` ที่แข็งแรง
- ใช้ DB user แบบ least privilege
- รักษา runtime + lockfile ให้ตรง CI เสมอ

---

## English (EN)

### 1) Overview

This repository is the backend API for the PSUIC IT Tracking System, built with Node.js + Express + Prisma (MySQL), and managed in production with PM2.

### 2) Tech Stack

- Node.js (CommonJS)
- Express 5
- Prisma + MySQL
- JWT
- Winston logging
- PM2
- Jest + Playwright

### 3) Runtime (Must Match CI)

- Node.js: `20.x`
- npm: `10.x`

Enforced by:

- `.nvmrc` (root + `client/`)
- `engines` + `packageManager` in `package.json`
- `preinstall` runtime guard (fails fast on mismatch)

Check runtime:

```bash
nvm use
node --version
npm --version
```

### 4) Project Structure

- Backend root: this folder
- Frontend: `client/`
- Prisma schema: `prisma/`
- Scripts: `scripts/`
- CI workflow: `.github/workflows/ci.yml`

### 5) Environment Files

- Dev template: `.env.example`
- Production template: `.env.production.example`
- Production runtime: `.env.production`

Minimum required vars:

- `SECRET`
- `DATABASE_URL`
- `CLIENT_URL`
- `FRONTEND_URL`

Common optional vars:

- SMTP: `MAIL_USER`, `MAIL_PASS`
- Google Calendar: `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_CALENDAR_ID`, `GOOGLE_PRIVATE_KEY`
- Frontend external rating form: `client/.env*` => `VITE_EXTERNAL_RATING_FORM_URL`
- Upload/backup/log rotation controls in `.env.production.example`

### 6) Installation

Install dependencies:

```bash
npm ci
cd client && npm ci
cd ..
```

Generate Prisma client:

```bash
npx prisma generate
```

Dev DB setup:

```bash
npx prisma db push
npm run seed
```

### 7) Development Run

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

### 8) Production Run (PM2)

PM2 app name:

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

### 9) Windows Production Deploy

Main deploy script:

```bat
windows-deploy.bat
```

Runtime verification:

```bat
windows-runtime-check.bat
```

Enable PM2 auto-start after reboot:

```bat
windows-enable-pm2-startup.bat
```

Scheduled task name:

- `TrackingSystem-PM2-Resurrect`

### 10) CI/Lockfile Guard Rails

Runtime guard:

```bash
npm run guard:runtime:strict
```

Lockfile guard (npm10):

```bash
npm run guard:lockfile:npm10
```

Safe lockfile refresh after package updates:

```bash
npm run guard:update-lockfile:npm10
```

### 11) Migration / Production Preflight

Run production preflight:

```bash
npm run preflight:prod
```

Apply SQL migrations (production-safe path):

```bash
npm run migrate:sql:prod
```

### 12) Testing

Backend tests:

```bash
npm test
```

Unit only (no DB):

```bash
npm run test:unit
```

Smoke test:

```bash
npm run smoke:predeploy
```

E2E:

```bash
npm run test:e2e
```

E2E selector contract:

```bash
npm run check:e2e:selectors
```

Selector guideline:

- `docs/TEST_GUIDELINES.md`

### 13) Logs and Backups

Main logs:

- `logs/out.log`
- `logs/error.log`
- additional logs in `logs/`

Rotate logs:

```bash
npm run logs:rotate
```

Backup helpers:

```bash
npm run uploads:backup
npm run backup:offsite
```

Scheduler env controls:

- `DB_BACKUP_CRON`
- `UPLOAD_BACKUP_CRON`
- `UPLOAD_CLEANUP_CRON`
- `OFFSITE_BACKUP_CRON`

### 14) API Documentation

Swagger UI:

- `http://<host>:<port>/api-docs`
- or `https://<host>:<port>/api-docs` when HTTPS is enabled

### 15) Troubleshooting

`npm ci` fails with lock mismatch:

```bash
npm run guard:update-lockfile:npm10
```

Then commit both:

- `package-lock.json`
- `client/package-lock.json`

Install fails with wrong Node/npm:

```bash
nvm use
```

Server starts but health fails:

- check `PORT` in `.env.production`
- check `pm2 logs tracking-system-backend`
- run `windows-runtime-check.bat` on Windows

Google sync error `self-signed certificate in certificate chain`:

- caused by TLS interception/proxy on network
- fix trust chain at OS/network level

### 16) Security Notes

- Never commit real `.env` / `.env.production`
- Use strong `SECRET`
- Use least-privilege DB accounts
- Keep runtime + lockfiles aligned with CI
