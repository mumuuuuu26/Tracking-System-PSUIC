const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const { logger } = require('./logger');

const initScheduledJobs = () => {
  // Schedule backup at 3:00 AM every day
  // Cron format: Second (optional), Minute, Hour, Day of Month, Month, Day of Week
  cron.schedule('0 3 * * *', () => {
    logger.info('⏰ Starting scheduled database backup...');
    
    const backupScript = path.join(__dirname, '../scripts/backup_db.js');
    
    // Execute the backup script
    exec(`node "${backupScript}"`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`❌ Scheduled backup failed: ${error.message}`);
        return;
      }
      if (stderr) {
        // exec can return stderr even on success for some commands/warnings, 
        // but usually we want to log it if it's significant.
        // For now, we'll log it as info unless it's an error.
        logger.warn(`⚠️ Backup script stderr: ${stderr}`);
      }
      
      logger.info(`✅ Scheduled backup completed successfully.`);
      logger.info(`📄 Output: ${stdout.trim()}`);
    });
  });

  logger.info('📅 Backup scheduler initialized (Running daily at 3:00 AM)');
};

module.exports = { initScheduledJobs };
