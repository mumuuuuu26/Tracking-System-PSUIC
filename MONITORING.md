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
pm2 logs db-backup-cron
```

## 🔄 Checking Status

To see all running processes and their uptime:
```bash
pm2 list
```

## 💾 Backup Status
The system is configured to backup the database **Daily at 2:00 AM**.
- Backups are stored in: `backups/`
- Old backups (older than 7 days) are automatically deleted.
- Check backup process execution: `pm2 logs db-backup-cron`
