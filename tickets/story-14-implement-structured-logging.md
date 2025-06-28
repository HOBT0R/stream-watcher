# Story-14: Implement Structured Logging & Request Correlation

## 📋 Story Overview

**As a** Site Reliability Engineer monitoring the proxy service  
**I want** structured logging with request correlation IDs  
**So that** I can trace requests across services and quickly diagnose issues in production

## 🎯 Acceptance Criteria

### Must Have
- [ ] Replace console.log with structured logging library (winston or pino)
- [ ] Generate unique correlation ID for each request
- [ ] Include correlation ID in all log messages within request scope
- [ ] Forward correlation ID to upstream BFF service
- [ ] Log request/response metadata (method, url, status, duration)
- [ ] Configure different log levels per environment (debug in dev, info+ in prod)
- [ ] JSON-formatted logs for production (Cloud Logging compatibility)

### Should Have
- [ ] Performance metrics logging (response times, auth latency)
- [ ] Error context logging (stack traces, user context)
- [ ] Request body logging for debugging (sanitized, configurable)
- [ ] Log sampling for high-volume endpoints

### Could Have
- [ ] Integration with distributed tracing systems (OpenTelemetry)
- [ ] Log aggregation and search capabilities
- [ ] Automated log-based alerting rules

## 🏗️ Technical Design

### Current State
```typescript
// Scattered console.log statements
console.log('[Auth → BFF] Outgoing Bearer token:', idToken);
console.log('[Proxy→BFF] Authorization header:', outboundAuth);
```

### Target State
```typescript
// Structured logging with correlation
import { logger } from './utils/logger.js';

// Request middleware
app.use((req, res, next) => {
  req.correlationId = generateCorrelationId();
  req.logger = logger.child({ correlationId: req.correlationId });
  next();
});

// Throughout the app
req.logger.info('Processing auth request', {
  userId: req.user?.sub,
  endpoint: req.path,
  method: req.method
});
```

## 🔧 Implementation Plan

### Phase 1: Logging Infrastructure (2 hours)

1. **Install and configure logging library**
   ```bash
   npm install winston
   npm install --save-dev @types/winston
   ```

2. **Create logging configuration**
   ```typescript
   // src/utils/logger.ts
   import winston from 'winston';
   
   const isDevelopment = process.env.NODE_ENV !== 'production';
   
   export const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       isDevelopment 
         ? winston.format.combine(
             winston.format.colorize(),
             winston.format.simple()
           )
         : winston.format.json()
     ),
     transports: [
       new winston.transports.Console(),
       // Add file transport for development
       ...(isDevelopment ? [
         new winston.transports.File({ 
           filename: 'logs/proxy.log',
           level: 'debug'
         })
       ] : [])
     ]
   });
   ```

3. **Create correlation ID middleware**
   ```typescript
   // src/middleware/correlation.ts
   import { Request, Response, NextFunction } from 'express';
   import { randomUUID } from 'crypto';
   import { logger } from '../utils/logger.js';
   
   export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
     // Check if correlation ID already exists (from load balancer)
     const existingId = req.headers['x-correlation-id'] as string;
     const correlationId = existingId || randomUUID();
     
     // Attach to request
     req.correlationId = correlationId;
     req.logger = logger.child({ 
       correlationId,
       service: 'proxy' 
     });
     
     // Add to response headers
     res.setHeader('x-correlation-id', correlationId);
     
     next();
   }
   ```

### Phase 2: Request/Response Logging (1.5 hours)

1. **Create request logging middleware**
   ```typescript
   // src/middleware/requestLogging.ts
   export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
     const startTime = Date.now();
     
     req.logger.info('Request started', {
       method: req.method,
       url: req.url,
       userAgent: req.headers['user-agent'],
       ip: req.ip,
       userId: req.user?.sub // Added after auth middleware
     });
     
     // Log request body for debugging (sanitized)
     if (process.env.LOG_REQUEST_BODY === 'true' && req.body) {
       req.logger.debug('Request body', {
         body: sanitizeRequestBody(req.body)
       });
     }
     
     // Capture response
     const originalSend = res.send;
     res.send = function(body) {
       const duration = Date.now() - startTime;
       
       req.logger.info('Request completed', {
         method: req.method,
         url: req.url,
         statusCode: res.statusCode,
         duration,
         responseSize: body?.length || 0
       });
       
       if (res.statusCode >= 400) {
         req.logger.error('Request failed', {
           statusCode: res.statusCode,
           error: body
         });
       }
       
       return originalSend.call(this, body);
     };
     
     next();
   }
   ```

2. **Sanitize sensitive data**
   ```typescript
   // src/utils/sanitizer.ts
   export function sanitizeRequestBody(body: any): any {
     if (!body || typeof body !== 'object') return body;
     
     const sanitized = { ...body };
     const sensitiveFields = ['password', 'token', 'authorization', 'secret'];
     
     for (const field of sensitiveFields) {
       if (sanitized[field]) {
         sanitized[field] = '[REDACTED]';
       }
     }
     
     return sanitized;
   }
   ```

### Phase 3: Auth & Proxy Logging (1 hour)

1. **Update auth middleware logging**
   ```typescript
   // src/auth/middleware.ts
   export function createAuthMiddleware(
     userTokenConfig: UserTokenConfig,
     googleConfig: GoogleAuthConfig,
     bffAudience: string
   ): RequestHandler {
     return async (req: Request, res: Response, next: NextFunction) => {
       try {
         req.logger.debug('Starting authentication flow');
         
         // Phase 1: User token verification
         if (userTokenConfig.skipVerification) {
           req.user = userTokenConfig.mockUser || {
             sub: 'dev-user',
             email: 'dev@example.com'
           };
           req.logger.debug('Development auth bypass - using mock user');
         } else {
           const authHeader = req.headers.authorization;
           if (!authHeader?.startsWith('Bearer ')) {
             throw new AuthenticationError('Authorization header required');
           }
           
           const token = authHeader.split(' ')[1];
           req.user = await userTokenVerifier.verify(token);
           req.logger.info('User token verification successful', {
             userId: req.user.sub
           });
         }
         
         // Phase 2: Google service token injection
         if (googleConfig.skipAuth) {
           req.logger.debug('Development mode - skipping service token injection');
         } else {
           const serviceToken = await googleTokenGenerator.generateIdToken(bffAudience);
           req.headers.authorization = `Bearer ${serviceToken}`;
           req.logger.debug('Google service token injected for upstream auth');
         }
         
         next();
       } catch (error) {
         req.logger.error('Authentication failed', {
           error: error.message,
           userId: req.user?.sub
         });
         next(error);
       }
     };
   }
   ```

2. **Update proxy logging**
   ```typescript
   // src/app.ts - in proxy configuration
   on: {
     proxyReq: (proxyReq, req) => {
       req.logger.debug('Forwarding request to BFF', {
         target: config.bffTargetUrl,
         method: proxyReq.method,
         path: proxyReq.path
       });
       
       // Add correlation ID to upstream request
       proxyReq.setHeader('x-correlation-id', req.correlationId);
       
       if (process.env.LOG_BFF_TOKEN === 'true') {
         const authHeader = proxyReq.getHeader('authorization');
         req.logger.debug('Auth header forwarded to BFF', {
           hasAuth: !!authHeader,
           authType: authHeader?.toString().split(' ')[0]
         });
       }
     },
     
     proxyRes: (proxyRes, req) => {
       req.logger.info('Received response from BFF', {
         statusCode: proxyRes.statusCode,
         contentLength: proxyRes.headers['content-length']
       });
     },
     
     error: (err, req, res) => {
       req.logger.error('Proxy error', {
         error: err.message,
         stack: err.stack,
         target: config.bffTargetUrl
       });
     }
   }
   ```

### Phase 4: Performance & Metrics Logging (30 minutes)

```typescript
// src/middleware/metrics.ts
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms
    
    req.logger.info('Request metrics', {
      metric: 'request_duration',
      value: duration,
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode
    });
    
    // Log slow requests
    if (duration > 1000) {
      req.logger.warn('Slow request detected', {
        duration,
        endpoint: req.path,
        threshold: 1000
      });
    }
  });
  
  next();
}
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// src/utils/logger.test.ts
describe('Logger Configuration', () => {
  it('should use JSON format in production');
  it('should use colorized format in development');
  it('should respect LOG_LEVEL environment variable');
  it('should create child loggers with context');
});

// src/middleware/correlation.test.ts
describe('Correlation Middleware', () => {
  it('should generate correlation ID for new requests');
  it('should preserve existing correlation ID from headers');
  it('should add correlation ID to response headers');
  it('should create child logger with correlation ID');
});
```

### Integration Tests
```typescript
// src/middleware/requestLogging.test.ts
describe('Request Logging Integration', () => {
  it('should log request start and completion');
  it('should calculate request duration accurately');
  it('should sanitize sensitive request data');
  it('should log errors with stack traces');
});
```

### Manual Testing Checklist
- [ ] Correlation IDs appear in all log messages within request
- [ ] JSON logs are valid and parseable in production
- [ ] Sensitive data is properly sanitized
- [ ] Performance impact is minimal (< 5ms per request)

## ⚠️ Gotchas & Risks

### High Risk
1. **Performance Impact**
   - Risk: Structured logging might slow down requests
   - Mitigation: Use async logging, avoid expensive serialization
   - Test: Load test before/after implementation

2. **Log Volume in Production**
   - Risk: Excessive logging might overwhelm log storage
   - Mitigation: Implement log sampling for high-volume endpoints
   - Test: Monitor log volume in staging

### Medium Risk
1. **Sensitive Data Exposure**
   - Risk: Accidentally logging credentials or personal data
   - Mitigation: Comprehensive sanitization, regular audit
   - Test: Scan logs for sensitive patterns

2. **Log Format Breaking Changes**
   - Risk: Changing log format might break existing monitoring
   - Mitigation: Gradual rollout, maintain backward compatibility period
   - Test: Validate with existing log parsing tools

### Low Risk
1. **Correlation ID Conflicts**
   - Risk: Collision in correlation ID generation
   - Mitigation: Use UUID v4 for guaranteed uniqueness
   - Test: Validate uniqueness in load tests

## 🔍 Definition of Done

- [ ] All console.log statements replaced with structured logging
- [ ] Correlation IDs generated and propagated through requests
- [ ] Request/response metadata logged with appropriate levels
- [ ] Sensitive data sanitization implemented and tested
- [ ] Performance impact assessed (< 5ms overhead per request)
- [ ] All tests pass (unit, integration, manual)
- [ ] Documentation updated with logging guidelines
- [ ] Deployed to staging and validated with log aggregation tools

## 📚 References

- [Winston.js Documentation](https://github.com/winstonjs/winston)
- [Google Cloud Logging Best Practices](https://cloud.google.com/logging/docs/best-practices)
- [Structured Logging Guidelines](https://github.com/trentm/node-bunyan#log-record-fields)
- [Request Correlation Patterns](https://blog.rapid7.com/2016/12/23/the-value-of-correlation-ids/)

## 🏷️ Labels
`enhancement` `observability` `logging` `medium-priority`

## 📊 Story Points
**5 points** (1 sprint)

## 🔗 Dependencies
- None (can be implemented independently)

## 🎯 Success Metrics
- 100% of log messages include correlation ID
- Zero sensitive data exposure incidents
- Request tracing time reduced from hours to minutes
- Log-based alerting response time < 2 minutes 