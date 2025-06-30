import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import winston from 'winston';

export function createCorrelationMiddleware(logger: winston.Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if correlation ID already exists (from load balancer or upstream service)
    const existingId = req.headers['x-correlation-id'] as string;
    const correlationId = existingId || randomUUID();
    
    // Attach correlation ID to request
    req.correlationId = correlationId;
    
    // Create child logger with correlation context
    req.logger = logger.child({ 
      correlationId,
      service: 'proxy' 
    });
    
    // Add correlation ID to response headers for tracing
    res.setHeader('x-correlation-id', correlationId);
    
    next();
  };
} 