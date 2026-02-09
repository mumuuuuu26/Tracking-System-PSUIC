module.exports = {
  apps : [{
    name   : "tracking-system-backend",
    script : "./server.js",
  
    // --- เพิ่มส่วนนี้ ---
    // log_date_format: "YYYY-MM-DD HH:mm Z", // ใส่เวลาให้ Log อ่านง่าย
    // error_file: "./logs/error.log",        // แยก Log แดง (Error)
    // out_file: "./logs/out.log",            // แยก Log ขาว (Info)
    // merge_logs: true,                      // รวม Log ของหลายๆ thread (ถ้ามี)
    // ------------------
    env_production: {
       NODE_ENV: "production",
       PORT: 5002
    }
  }]
}
