module.exports = {
  apps : [{
    name   : "tracking-system-backend",
    script : "./server.js",
  
    // --- Log Configuration ---
    log_date_format: "YYYY-MM-DD HH:mm Z",
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    merge_logs: true,
    max_memory_restart: "500M", // Auto-restart if memory exceeds 500M
    // -------------------------
    env_production: {
       NODE_ENV: "production",
       PORT: 5002
    }
  }, {
    name: "db-backup-cron",
    script: "./scripts/backup_db.js",
    instances: 1,
    exec_mode: "fork",
    cron_restart: "0 2 * * *", // Run every day at 2:00 AM
    autorestart: false, // Don't restart if it exits (it's a script)
    watch: false
  }]
}
