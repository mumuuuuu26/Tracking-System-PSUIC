# Monitoring Guide

This guide explains how to monitor the **IT Support & Asset Tracking System** using PM2.

## 📊 Real-time Monitoring

To see live status of CPU, Memory, and Logs:

```bash
pm2 monit
```

### What to look for:
- **CPU**: Should be low (< 10%) when idle. Spikes are normal during requests.
- **Memory**: Backend typically uses 50MB - 200MB. If it grows indefinitely, there might be a memory leak.
- **Loop Delay**: High delay means the server is blocked (too much work).

## 📝 Checking Logs

To view recent logs:
```bash
pm2 logs
```

To view logs for a specific app:
```bash
pm2 logs tracking-system-backend
```

## 🔄 Checking Status

To see all running processes and their uptime:
```bash
pm2 list
```

## 💾 Backup Status
The backend scheduler runs database backup based on `DB_BACKUP_CRON` (default: `0 3 * * *`).
- Backups are stored in: `backups/`
- Old backups (older than 7 days) are automatically deleted.
- Check backup execution from backend logs:
  - `pm2 logs tracking-system-backend --lines 200`
  - Find lines like `[Scheduler] Starting database backup...` and `Backup successful: ...`
