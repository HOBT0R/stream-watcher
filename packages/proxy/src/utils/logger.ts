import winston from 'winston';
import { ValidatedLoggingConfig } from '../config/schema.js';
import fs from 'fs';
import path from 'path';

export function createLogger(config: ValidatedLoggingConfig): winston.Logger {
  const transports: winston.transport[] = [
    new winston.transports.Console()
  ];

  // Add file transport for development
  if (config.enableFileLogging) {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    transports.push(new winston.transports.File({ 
      filename: path.join(logsDir, 'proxy.log'),
      level: 'debug',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }));
  }

  return winston.createLogger({
    level: config.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      config.format === 'simple'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json()
    ),
    transports,
    // Prevent winston from exiting on error
    exitOnError: false
  });
} 