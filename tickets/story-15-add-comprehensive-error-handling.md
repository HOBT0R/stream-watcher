# Story-15: Add Comprehensive Error Handling

## 📋 Story Overview

**As a** developer debugging proxy issues  
**I want** comprehensive error handling with specific error types and helpful messages  
**So that** I can quickly identify and resolve different types of failures in the system

## 🎯 Acceptance Criteria

### Must Have
- [ ] Custom error classes for different failure types (Auth, Config, Proxy, etc.)
- [ ] Centralized error handling middleware with consistent response format
- [ ] Proper HTTP status codes for different error scenarios
- [ ] Error logging with context and stack traces
- [ ] Graceful handling of upstream service failures
- [ ] Client-friendly error messages (no sensitive info exposure)

### Should Have
- [ ] Error categorization (client vs server errors)
- [ ] Retry logic for transient failures
- [ ] Circuit breaker pattern for upstream service protection
- [ ] Error rate monitoring and alerting
- [ ] Error response caching for repeated failures

### Could Have
- [ ] Error analytics and trending
- [ ] Automatic error recovery mechanisms
- [ ] Integration with external error tracking services (Sentry, Bugsnag)

## 🏗️ Technical Design

### Current State
```typescript
// Inconsistent error handling
res.status(401).json({ error: 'Unauthorized' });
console.error('Failed to verify token:', error);
throw new Error('Configuration invalid');
```

### Target State
```typescript
// Structured error handling
throw new UserTokenAuthError('JWT verification failed', { 
  reason: 'invalid_signature',
  userId: req.user?.sub 
});

// Centralized error middleware
app.use(globalErrorHandler);

// Consistent error responses
{
  "error": {
    "type": "UserTokenAuthError",
    "message": "Authentication failed",
    "code": "JWT_INVALID_SIGNATURE",
    "timestamp": "2024-01-15T10:30:00Z",
    "correlationId": "uuid-here"
  }
}
```

## 🔧 Implementation Plan

### Phase 1: Custom Error Classes (1.5 hours)

1. **Create error hierarchy**
   ```typescript
   // src/errors/base.ts
   export abstract class AppError extends Error {
     abstract readonly statusCode: number;
     abstract readonly code: string;
     abstract readonly isOperational: boolean;
     
     constructor(
       message: string,
       public readonly context?: Record<string, any>
     ) {
       super(message);
       this.name = this.constructor.name;
       Error.captureStackTrace(this, this.constructor);
     }
   
     toJSON() {
       return {
         type: this.name,
         message: this.message,
         code: this.code,
         statusCode: this.statusCode,
         context: this.context
       };
     }
   }
   ```

2. **Define specific error types**
   ```typescript
   // src/errors/auth.ts
   export class AuthenticationError extends AppError {
     readonly statusCode = 401;
     readonly isOperational = true;
     
     constructor(message: string, context?: Record<string, any>) {
       super(message, context);
     }
     
     get code(): string {
       if (this.context?.reason === 'token_expired') return 'JWT_EXPIRED';
       if (this.context?.reason === 'invalid_signature') return 'JWT_INVALID_SIGNATURE';
       if (this.context?.reason === 'missing_token') return 'JWT_MISSING';
       return 'AUTH_FAILED';
     }
   }
   
   export class AuthorizationError extends AppError {
     readonly statusCode = 403;
     readonly code = 'INSUFFICIENT_PERMISSIONS';
     readonly isOperational = true;
   }
   
   // src/errors/config.ts
   export class ConfigurationError extends AppError {
     readonly statusCode = 500;
     readonly code = 'CONFIG_INVALID';
     readonly isOperational = false;
   }
   
   // src/errors/proxy.ts
   export class ProxyError extends AppError {
     readonly statusCode = 502;
     readonly isOperational = true;
     
     get code(): string {
       if (this.context?.code === 'ECONNREFUSED') return 'UPSTREAM_UNAVAILABLE';
       if (this.context?.code === 'ETIMEDOUT') return 'UPSTREAM_TIMEOUT';
       return 'PROXY_ERROR';
     }
   }
   
   // src/errors/validation.ts
   export class ValidationError extends AppError {
     readonly statusCode = 400;
     readonly code = 'VALIDATION_FAILED';
     readonly isOperational = true;
   }
   ```

### Phase 2: Centralized Error Handler (1 hour)

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/base.js';

export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Ensure we have a logger (fallback if correlation middleware hasn't run)
  const logger = req.logger || require('../utils/logger').logger;
  
  // Log the error with context
  logger.error('Request failed with error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.sub,
    correlationId: req.correlationId
  });

  // Handle known application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        type: error.name,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId
      }
    });
  }

  // Handle specific Node.js/library errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        type: 'ValidationError',
        message: 'Request validation failed',
        code: 'VALIDATION_FAILED',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        details: error.message
      }
    });
  }

  // Handle JOSE/JWT specific errors
  if (error.name === 'JOSEError' || error.name === 'JWTExpired') {
    return res.status(401).json({
      error: {
        type: 'UserTokenVerificationError',
        message: 'Token verification failed',
        code: error.name === 'JWTExpired' ? 'JWT_EXPIRED' : 'JWT_INVALID',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId
      }
    });
  }

  // Fallback for unknown errors
  logger.error('Unhandled error', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });

  res.status(500).json({
    error: {
      type: 'InternalServerError',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    }
  });
}

// Express async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### Phase 3: Update Existing Error Handling (1.5 hours)

1. **Update auth middleware**
   ```typescript
   // src/middleware/auth.ts
   import { AuthenticationError } from '../errors/auth.js';
   import { asyncHandler } from '../middleware/errorHandler.js';
   
   export const verifyToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
     const authHeader = req.headers.authorization;
     
     if (!authHeader?.startsWith('Bearer ')) {
       throw new AuthenticationError('Authorization header required', {
         reason: 'missing_token',
         endpoint: req.path
       });
     }
   
     const token = authHeader.split(' ')[1];
     
     try {
       const payload = await verifyJwtToken(token);
       req.user = payload;
       next();
     } catch (error) {
       if (error.name === 'TokenExpiredError') {
         throw new AuthenticationError('Token has expired', {
           reason: 'token_expired',
           expiredAt: error.expiredAt
         });
       }
       
       if (error.name === 'JsonWebTokenError') {
         throw new AuthenticationError('Invalid token signature', {
           reason: 'invalid_signature'
         });
       }
       
       throw new AuthenticationError('Token verification failed', {
         reason: 'verification_failed',
         originalError: error.message
       });
     }
   });
   ```

2. **Update proxy error handling**
   ```typescript
   // src/app.ts - in proxy configuration
   on: {
     error: (err, req, res) => {
       const proxyError = new ProxyError('Upstream service error', {
         code: err.code,
         target: config.bffTargetUrl,
         timeout: err.timeout
       });
       
       // Pass to global error handler
       next(proxyError);
     }
   }
   ```

3. **Update config validation**
   ```typescript
   // src/config.ts
   import { ConfigurationError } from '../errors/config.js';
   
   export function getValidatedConfig(): AppConfig {
     try {
       const config = parseConfig();
       validateConfig(config);
       return config;
     } catch (error) {
       throw new ConfigurationError('Configuration validation failed', {
         missingFields: getMissingFields(),
         invalidFields: getInvalidFields()
       });
     }
   }
   ```

### Phase 4: Circuit Breaker & Retry Logic (1 hour)

```typescript
// src/utils/circuitBreaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ProxyError('Circuit breaker is OPEN', {
          state: this.state,
          failures: this.failures
        });
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime.getTime() > this.timeout;
  }
}

// Usage in proxy
const circuitBreaker = new CircuitBreaker();

// Wrap proxy operations
app.use('/api', asyncHandler(async (req, res, next) => {
  await circuitBreaker.execute(async () => {
    // Proxy logic here
  });
}));
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// src/errors/auth.test.ts
describe('AuthenticationError', () => {
  it('should set correct status code and message');
  it('should include context in error details');
  it('should generate appropriate error codes based on context');
});

// src/middleware/errorHandler.test.ts
describe('Global Error Handler', () => {
  it('should handle AppError instances correctly');
  it('should not leak sensitive info in production');
  it('should log errors with correlation ID');
  it('should handle unknown errors gracefully');
});
```

### Integration Tests
```typescript
// src/middleware/integration.test.ts
describe('Error Handling Integration', () => {
  it('should return 401 for invalid JWT');
  it('should return 502 for upstream service failures');
  it('should return 500 for configuration errors');
  it('should include correlation ID in error responses');
});
```

### Error Scenario Tests
```typescript
// test/scenarios/errors.test.ts
describe('Error Scenarios', () => {
  it('should handle expired JWT tokens');
  it('should handle upstream service timeout');
  it('should handle malformed requests');
  it('should handle missing configuration');
});
```

## ⚠️ Gotchas & Risks

### High Risk
1. **Information Disclosure**
   - Risk: Accidentally exposing sensitive info in error messages
   - Mitigation: Sanitize all error responses, different levels for dev/prod
   - Test: Security audit of all error responses

2. **Error Loop**
   - Risk: Error handler itself throwing errors
   - Mitigation: Robust error handler with fallbacks, try-catch blocks
   - Test: Simulate error handler failures

### Medium Risk
1. **Performance Impact**
   - Risk: Error handling overhead affecting normal requests
   - Mitigation: Efficient error processing, async logging
   - Test: Performance testing with error scenarios

2. **Circuit Breaker False Positives**
   - Risk: Circuit breaker triggering on legitimate temporary issues
   - Mitigation: Tunable thresholds, proper monitoring
   - Test: Load testing with intermittent failures

### Low Risk
1. **Error Code Consistency**
   - Risk: Inconsistent error codes across different scenarios
   - Mitigation: Centralized error code registry, documentation
   - Test: Error code validation tests

## 🔍 Definition of Done

- [ ] All custom error classes implemented and tested
- [ ] Centralized error handling middleware integrated
- [ ] All existing error handling updated to use new system
- [ ] Circuit breaker implemented for upstream calls
- [ ] Error responses tested and validated
- [ ] No sensitive information leaked in error messages
- [ ] Performance impact assessed (< 2ms per error)
- [ ] Documentation updated with error handling guidelines

## 📚 References

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/learn/asynchronous-work/nodejs-error-handling-best-practices)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## 🏷️ Labels
`enhancement` `error-handling` `reliability` `high-priority`

## 📊 Story Points
**5 points** (1 sprint)

## 🔗 Dependencies
- Depends on Story-14 (structured logging) for error logging
- Should be coordinated with Story-13 (config validation) for error consistency

## 🎯 Success Metrics
- 100% of errors properly categorized and logged
- Zero information disclosure incidents
- Error resolution time reduced by 60%
- Circuit breaker prevents cascade failures 