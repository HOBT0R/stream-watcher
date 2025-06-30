import { Request, NextFunction } from 'express';
import type { Response } from 'express';
import winston from 'winston';
import { sanitizeRequestBody } from '../utils/sanitizer.js';

export function createRequestLoggingMiddleware(
  logger: winston.Logger,
  enableBodyLogging: boolean
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestLogger = req.logger || logger;

    // Skip body logging if disabled
    if (!enableBodyLogging) {
      return next();
    }

    // Log request body for non-GET requests
    if (req.method !== 'GET' && req.body) {
      const sanitizedBody = sanitizeRequestBody(req.body);
      
      requestLogger.debug('Request body captured', {
        event: 'request_body_logged',
        method: req.method,
        path: req.path,
        contentType: req.get('content-type'),
        bodySize: JSON.stringify(req.body).length,
        sanitizedBody,
        correlationId: req.correlationId
      });
    }

    // Store original json method to capture response bodies
    const originalJson = res.json.bind(res);
    
    // Override response.json to capture response bodies
    res.json = function(body: unknown) {
      // Log response body
      const sanitizedResponseBody = sanitizeRequestBody(body);
      
      requestLogger.debug('Response body captured', {
        event: 'response_body_logged',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        bodySize: JSON.stringify(body).length,
        sanitizedBody: sanitizedResponseBody,
        correlationId: req.correlationId
      });

      // Call original json method
      return originalJson(body);
    };

    next();
  };
}

// Middleware to log raw request data (query params, headers)
export function createRequestDetailsMiddleware(
  logger: winston.Logger,
  enableRequestLogging: boolean
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestLogger = req.logger || logger;

    if (!enableRequestLogging) {
      return next();
    }

    // Log detailed request information
    requestLogger.debug('Request details captured', {
      event: 'request_details_logged',
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
        'content-length': req.get('content-length'),
        'accept': req.get('accept'),
        'authorization': req.get('authorization') ? '[PRESENT]' : undefined
      },
      ip: req.ip,
      correlationId: req.correlationId
    });

    // Log response details when response finishes
    res.on('finish', () => {
      requestLogger.debug('Response details captured', {
        event: 'response_details_logged',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        headers: {
          'content-type': res.get('content-type'),
          'content-length': res.get('content-length'),
          'x-correlation-id': res.get('x-correlation-id')
        },
        correlationId: req.correlationId
      });
    });

    next();
  };
} 