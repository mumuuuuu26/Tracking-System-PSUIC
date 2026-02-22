const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const isCi = ['1', 'true'].includes(String(process.env.CI).toLowerCase());
const isTestLike = process.env.NODE_ENV === 'test' || isCi;
const enableTestLogs = process.env.ENABLE_TEST_LOGS === 'true';
const enableTestHttpLogs = process.env.ENABLE_TEST_HTTP_LOGS === 'true';

// Determine log directory
const logDir = path.join(__dirname, '../logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const transports = [];

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
if (!isTestLike || enableTestLogs) {
  transports.push(
    // debug log setting
    new winston.transports.DailyRotateFile({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir, // log file /logs/debug-*.log
      filename: `%DATE%.log`,
      maxFiles: '90d', // 90 Days saved (Legal Requirement)
      json: false,
      zippedArchive: true,
    })
  );
  transports.push(
    // error log setting
    new winston.transports.DailyRotateFile({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error', // log file /logs/error/error-*.log
      filename: `%DATE%.error.log`,
      maxFiles: '90d', // 90 Days saved (Legal Requirement)
      handleExceptions: true,
      json: false,
      zippedArchive: true,
    })
  );
}

if (isTestLike && !enableTestLogs) {
  transports.push(
    new winston.transports.Console({
      level: 'error',
      format: logFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.colorize(),
      ),
    })
  );
}

const logger = winston.createLogger({
  format: logFormat,
  transports,
});

const stream = {
  write: (message) => {
    if (isTestLike && !enableTestHttpLogs) return;

    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      logger.info(trimmedMessage);
    }
  },
};

module.exports = { logger, stream };
