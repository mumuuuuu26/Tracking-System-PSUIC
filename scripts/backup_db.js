const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // อ่านรหัสจาก .env

// ตั้งค่าที่เก็บไฟล์ Backup
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// ตั้งชื่อไฟล์ตามวันเวลา (เช่น db_2026-02-06_1030.sql)
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `db_backup_${timestamp}.sql`;
const filePath = path.join(backupDir, filename);

// ดึงค่าจาก DATABASE_URL ใน .env (mysql://root:pass@localhost:3306/db)
const DB_USER = 'root';
const DB_PASS = '2602546mn'; // Retrieved from user provided configuration
const DB_NAME = 'tracking_system';

const cmd = `mysqldump -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > "${filePath}"`;

console.log(`Starting backup...`);
exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`Backup failed: ${error.message}`);
        return;
    }
    console.log(`Backup successful: ${filename}`);
    
    // (Optional) ลบไฟล์เก่าเกิน 7 วันทิ้ง เพื่อไม่ให้รก
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > SEVEN_DAYS) {
             fs.unlinkSync(filePath);
             console.log(`Deleted old backup: ${file}`);
        }
    });
});
