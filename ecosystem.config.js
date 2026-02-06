module.exports = {
  apps: [{
    name: "tracking-system",
    script: "./server.js",
    instances: 1,
    exec_mode: "fork",
    // Logging Configuration
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    merge_logs: true,
    // Environment
    env: {
      NODE_ENV: "production",
    }
  }]
};
