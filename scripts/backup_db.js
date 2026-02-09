const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use our logger if running within the app context, otherwise fallback to console
let logger = console;
try {
    const logUtils = require('../utils/logger');
    logger = logUtils.logger;
} catch (e) {
    // Fallback if logger utility isn't found (e.g. running script standalone)
}

// ตั้งค่าที่เก็บไฟล์ Backup
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// ตั้งชื่อไฟล์ตามวันเวลา (เช่น db_2026-02-06_1030.sql)
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `db_backup_${timestamp}.sql`;
const filePath = path.join(backupDir, filename);

// ดึงค่าจาก ENV หรือใช้ค่า Default (ควรระวัง)
const dbUrl = process.env.DATABASE_URL;
let DB_USER = 'root';
let DB_PASS = '';
let DB_NAME = 'tracking_system';
let DB_HOST = 'localhost';
let DB_PORT = '3306';

// Try to parse DATABASE_URL if available for better security than hardcoding
if (dbUrl) {
    try {
        // Format: mysql://USER:PASS@HOST:PORT/DB
        const url = new URL(dbUrl);
        DB_USER = url.username || DB_USER;
        DB_PASS = url.password || DB_PASS;
        DB_HOST = url.hostname || DB_HOST;
        DB_PORT = url.port || DB_PORT;
        DB_NAME = url.pathname.replace('/', '') || DB_NAME;
    } catch (e) {
        logger.error('Failed to parse DATABASE_URL, using defaults/hardcoded values.');
    }
}

// Escaping password for shell command might be needed if it contains special chars
// For simplicity in this script, we assume basic alphanumeric or handling by exec
const cmd = `mysqldump -u ${DB_USER} -p"${DB_PASS}" -h ${DB_HOST} -P ${DB_PORT} ${DB_NAME} > "${filePath}"`;

logger.info(`Starting database backup for ${DB_NAME}...`);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        logger.error(`Backup failed: ${error.message}`);
        return;
    }
    logger.info(`Backup successful: ${filename}`);
    
    // (Optional) ลบไฟล์เก่าเกิน 7 วันทิ้ง เพื่อไม่ให้รก
    try {
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        
        files.forEach(file => {
            if (!file.endsWith('.sql')) return;
            
            const currentFilePath = path.join(backupDir, file);
            const stats = fs.statSync(currentFilePath);
            if (now - stats.mtime.getTime() > SEVEN_DAYS) {
                 fs.unlinkSync(currentFilePath);
                 logger.info(`Deleted old backup: ${file}`);
            }
        });
    } catch (cleanupError) {
        logger.error(`Cleanup failed: ${cleanupError.message}`);
    }
});
