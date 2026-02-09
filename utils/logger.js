const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Determine log directory
const logDir = path.join(__dirname, '../logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: logFormat,
  transports: [
    // debug log setting
    new winston.transports.DailyRotateFile({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir, // log file /logs/debug-*.log
      filename: `%DATE%.log`,
      maxFiles: '30d', // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
    // error log setting
    new winston.transports.DailyRotateFile({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error', // log file /logs/error/error-*.log
      filename: `%DATE%.error.log`,
      maxFiles: '30d', // 30 Days saved
      handleExceptions: true,
      json: false,
      zippedArchive: true,
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.colorize(),
    ),
  })
);

const stream = {
  write: (message) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

module.exports = { logger, stream };
