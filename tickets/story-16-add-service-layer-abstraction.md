# Story-16: Add Service Layer Abstraction

## 📋 Story Overview

**As a** developer working on the proxy service  
**I want** business logic separated into dedicated service classes  
**So that** the code is more testable, maintainable, and follows single responsibility principle

## 🎯 Acceptance Criteria

### Must Have
- [ ] Extract authentication logic into `AuthService` class
- [ ] Extract proxy forwarding logic into `ProxyService` class
- [ ] Extract configuration management into `ConfigService` class
- [ ] Service interfaces for dependency injection and testing
- [ ] All services properly unit tested in isolation
- [ ] Middleware becomes thin orchestration layer

### Should Have
- [ ] Service registry for dependency management
- [ ] Service lifecycle management (startup, shutdown)
- [ ] Service health checks
- [ ] Service-level metrics and monitoring

### Could Have
- [ ] Service caching strategies
- [ ] Service performance profiling
- [ ] Service hot reloading for development

## 🏗️ Technical Design

### Current State
```typescript
// Logic scattered across middleware and app.ts
app.use('/api', verifyToken); // 99 lines in middleware/auth.ts
app.use('/api', createProxyMiddleware({...})); // Logic in app.ts
const config = getConfig(); // Mixed concerns in config.ts
```

### Target State
```typescript
// Clean service separation
const authService = new AuthService(config.auth);
const proxyService = new ProxyService(config.proxy);
const configService = new ConfigService();

// Thin middleware orchestration
app.use('/api', authService.middleware());
app.use('/api', proxyService.middleware());
```

## 🔧 Implementation Plan

### Phase 1: Extract Authentication Service (2 hours)

1. **Create AuthService interface**
   ```typescript
   // src/services/interfaces/auth.ts
   export interface IAuthService {
     verifyToken(token: string): Promise<UserTokenPayload>;
     generateServiceToken(audience: string): Promise<string>;
     middleware(): RequestHandler;
   }
   
   export interface AuthServiceConfig {
     userToken: UserTokenConfig;
     google: GoogleAuthConfig;
     skipVerification?: boolean;
   }
   ```

2. **Implement AuthService**
   ```typescript
   // src/services/auth/AuthService.ts
   import { IAuthService, AuthServiceConfig } from '../interfaces/auth.js';
   import { UserTokenVerifier } from '../../auth/user-token-verifier/verifier.js';
   import { GoogleTokenGenerator } from '../../auth/google/tokenGenerator.js';
   
   export class AuthService implements IAuthService {
     private userTokenVerifier: UserTokenVerifier;
     private googleGenerator: GoogleTokenGenerator;
     
     constructor(private config: AuthServiceConfig) {
       this.userTokenVerifier = new UserTokenVerifier(config.userToken);
       this.googleGenerator = new GoogleTokenGenerator(config.google);
     }
     
     async verifyToken(token: string): Promise<UserTokenPayload> {
       if (this.config.skipVerification) {
         return { sub: 'dev-user', email: 'dev@example.com' } as UserTokenPayload;
       }
       
       return await this.userTokenVerifier.verify(token);
     }
     
     async generateServiceToken(audience: string): Promise<string> {
       if (process.env.NODE_ENV !== 'production') {
         return 'dev-service-token';
       }
       
       return await this.googleGenerator.generateIdToken(audience);
     }
     
     middleware(): RequestHandler {
       return async (req: Request, res: Response, next: NextFunction) => {
         try {
           req.logger.debug('Starting authentication');
           
           const authHeader = req.headers.authorization;
           if (!authHeader?.startsWith('Bearer ')) {
             throw new AuthenticationError('Authorization header required');
           }
           
           const token = authHeader.split(' ')[1];
           const payload = await this.verifyToken(token);
           
           req.user = payload;
           req.logger.info('Authentication successful', {
             userId: payload.sub,
             email: payload.email
           });
           
           // Inject service-to-service token in production
           if (process.env.NODE_ENV === 'production') {
             const serviceToken = await this.generateServiceToken(audience);
             req.headers.authorization = `Bearer ${serviceToken}`;
             
             req.logger.debug('Service token injected');
           }
           
           next();
         } catch (error) {
           next(error); // Let global error handler deal with it
         }
       };
     }
   }
   ```

### Phase 2: Extract Proxy Service (1.5 hours)

1. **Create ProxyService interface**
   ```typescript
   // src/services/interfaces/proxy.ts
   export interface IProxyService {
     forward(req: Request, res: Response): Promise<void>;
     middleware(): RequestHandler;
     healthCheck(): Promise<boolean>;
   }
   
   export interface ProxyServiceConfig {
     targetUrl: string;
     timeout?: number;
     retryAttempts?: number;
     circuitBreaker?: {
       threshold: number;
       timeout: number;
     };
   }
   ```

2. **Implement ProxyService**
   ```typescript
   // src/services/proxy/ProxyService.ts
   import { createProxyMiddleware } from 'http-proxy-middleware';
   import { CircuitBreaker } from '../../utils/circuitBreaker.js';
   
   export class ProxyService implements IProxyService {
     private circuitBreaker: CircuitBreaker;
     private proxyMiddleware: RequestHandler;
     
     constructor(private config: ProxyServiceConfig) {
       this.circuitBreaker = new CircuitBreaker(
         config.circuitBreaker?.threshold || 5,
         config.circuitBreaker?.timeout || 60000
       );
       
       this.proxyMiddleware = createProxyMiddleware({
         target: config.targetUrl,
         changeOrigin: true,
         timeout: config.timeout || 30000,
         pathRewrite: { '^/api': '' },
         
         on: {
           proxyReq: this.onProxyReq.bind(this),
           proxyRes: this.onProxyRes.bind(this),
           error: this.onProxyError.bind(this)
         }
       });
     }
     
     async forward(req: Request, res: Response): Promise<void> {
       return new Promise((resolve, reject) => {
         this.circuitBreaker.execute(async () => {
           this.proxyMiddleware(req, res, (err) => {
             if (err) reject(err);
             else resolve();
           });
         }).catch(reject);
       });
     }
     
     middleware(): RequestHandler {
       return (req: Request, res: Response, next: NextFunction) => {
         this.forward(req, res).catch(next);
       };
     }
     
     async healthCheck(): Promise<boolean> {
       try {
         const response = await fetch(`${this.config.targetUrl}/health`);
         return response.ok;
       } catch {
         return false;
       }
     }
     
     private onProxyReq(proxyReq: any, req: Request) {
       req.logger?.debug('Proxying request', {
         method: req.method,
         url: req.url,
         targetUrl: this.config.targetUrl
       });
     }
     
     private onProxyRes(proxyRes: any, req: Request, res: Response) {
       req.logger?.info('Proxy response received', {
         statusCode: proxyRes.statusCode,
         duration: Date.now() - req.startTime
       });
     }
     
     private onProxyError(err: Error, req: Request, res: Response) {
       req.logger?.error('Proxy error', {
         error: err.message,
         url: req.url
       });
       
       this.circuitBreaker.onFailure();
       
       if (!res.headersSent) {
         res.status(502).json({
           error: {
             type: 'ProxyError',
             message: 'Upstream service unavailable',
             code: 'UPSTREAM_ERROR'
           }
         });
       }
     }
   }
   ```

### Phase 3: Extract Configuration Service (1 hour)

```typescript
// src/services/config/ConfigService.ts
export class ConfigService {
  private config: ValidatedAppConfig;
  private watchers: Array<(config: ValidatedAppConfig) => void> = [];
  
  constructor() {
    this.config = this.loadAndValidate();
  }
  
  getConfig(): ValidatedAppConfig {
    return { ...this.config }; // Return copy to prevent mutation
  }
  
  getAuthConfig(): AuthServiceConfig {
    return {
      userToken: {
        skipVerification: this.config.jwt.skipVerification,
        jwksUri: this.config.jwt.jwksUri,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      },
      google: {
        projectId: this.config.google.projectId,
        audience: this.config.google.audience
      }
    };
  }
  
  getProxyConfig(): ProxyServiceConfig {
    return {
      targetUrl: this.config.bffTargetUrl,
      timeout: 30000,
      retryAttempts: 3,
      circuitBreaker: {
        threshold: 5,
        timeout: 60000
      }
    };
  }
  
  onChange(callback: (config: ValidatedAppConfig) => void) {
    this.watchers.push(callback);
  }
  
  private loadAndValidate(): ValidatedAppConfig {
    // Use existing validation logic
    return getValidatedConfig();
  }
  
  private notifyWatchers() {
    this.watchers.forEach(callback => callback(this.config));
  }
}
```

### Phase 4: Service Registry & Integration (1 hour)

1. **Create service container**
   ```typescript
   // src/services/ServiceContainer.ts
   export class ServiceContainer {
     private services = new Map<string, any>();
     
     register<T>(name: string, service: T): void {
       this.services.set(name, service);
     }
     
     get<T>(name: string): T {
       const service = this.services.get(name);
       if (!service) {
         throw new Error(`Service '${name}' not found`);
       }
       return service;
     }
     
     async startAll(): Promise<void> {
       for (const service of this.services.values()) {
         if (service.start) {
           await service.start();
         }
       }
     }
     
     async stopAll(): Promise<void> {
       for (const service of this.services.values()) {
         if (service.stop) {
           await service.stop();
         }
       }
     }
   }
   ```

2. **Update app.ts to use services**
   ```typescript
   // src/app.ts
   import { ServiceContainer } from './services/ServiceContainer.js';
   import { AuthService } from './services/auth/AuthService.js';
   import { ProxyService } from './services/proxy/ProxyService.js';
   import { ConfigService } from './services/config/ConfigService.js';
   
   export function createApp(): Express {
     const app = express();
     
     // Initialize services
     const container = new ServiceContainer();
     const configService = new ConfigService();
     const authService = new AuthService(configService.getAuthConfig());
     const proxyService = new ProxyService(configService.getProxyConfig());
     
     // Register services
     container.register('config', configService);
     container.register('auth', authService);
     container.register('proxy', proxyService);
     
     // Apply middleware (now thin orchestration)
     app.use(correlationMiddleware);
     app.use(requestLoggingMiddleware);
     
     // Static file serving
     app.use(express.static('dist'));
     
     // API routes with service middleware
     app.use('/api', authService.middleware());
     app.use('/api', proxyService.middleware());
     
     // Health check with service status
     app.get('/health', async (req, res) => {
       const authHealthy = true; // Auth is always healthy if app started
       const proxyHealthy = await proxyService.healthCheck();
       
       res.json({
         status: authHealthy && proxyHealthy ? 'healthy' : 'degraded',
         services: {
           auth: authHealthy ? 'healthy' : 'unhealthy',
           proxy: proxyHealthy ? 'healthy' : 'unhealthy'
         }
       });
     });
     
     // Error handling
     app.use(globalErrorHandler);
     
     return app;
   }
   ```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// src/services/auth/AuthService.test.ts
describe('AuthService', () => {
  let authService: AuthService;
  let mockConfig: AuthServiceConfig;
  
  beforeEach(() => {
    mockConfig = {
      userToken: { /* mock config */ },
      google: { /* mock config */ }
    };
    authService = new AuthService(mockConfig);
  });
  
  describe('verifyToken', () => {
    it('should verify valid user token');
    it('should skip verification in development mode');
    it('should throw AuthenticationError for invalid tokens');
  });
  
  describe('generateServiceToken', () => {
    it('should generate Google ID token in production');
    it('should return dev token in development');
  });
  
  describe('middleware', () => {
    it('should authenticate valid requests');
    it('should inject service token in production');
    it('should handle missing authorization header');
  });
});

// src/services/proxy/ProxyService.test.ts
describe('ProxyService', () => {
  let proxyService: ProxyService;
  
  beforeEach(() => {
    proxyService = new ProxyService({
      targetUrl: 'http://localhost:3000',
      timeout: 5000
    });
  });
  
  describe('forward', () => {
    it('should forward requests to target URL');
    it('should handle proxy errors gracefully');
    it('should respect circuit breaker state');
  });
  
  describe('healthCheck', () => {
    it('should return true for healthy upstream');
    it('should return false for unreachable upstream');
  });
});
```

### Integration Tests
```typescript
// src/services/integration.test.ts
describe('Service Integration', () => {
  let container: ServiceContainer;
  
  beforeEach(async () => {
    container = new ServiceContainer();
    // Setup test services
    await container.startAll();
  });
  
  afterEach(async () => {
    await container.stopAll();
  });
  
  it('should handle complete auth and proxy flow');
  it('should propagate errors correctly between services');
  it('should maintain service state correctly');
});
```

## ⚠️ Gotchas & Risks

### High Risk
1. **Service Dependency Management**
   - Risk: Circular dependencies between services
   - Mitigation: Clear dependency hierarchy, interface-based design
   - Test: Dependency graph validation

2. **Service Lifecycle Issues**
   - Risk: Services not starting/stopping cleanly
   - Mitigation: Proper startup/shutdown hooks, error handling
   - Test: Lifecycle integration tests

### Medium Risk
1. **Performance Overhead**
   - Risk: Service abstraction adds latency
   - Mitigation: Minimize abstraction layers, profile performance
   - Test: Performance benchmarks before/after

2. **Configuration Coupling**
   - Risk: Services tightly coupled to specific config format
   - Mitigation: Use dependency injection, interface segregation
   - Test: Config variation tests

### Low Risk
1. **Service Discovery Complexity**
   - Risk: Service registry becomes complex
   - Mitigation: Keep registry simple, avoid over-engineering
   - Test: Service resolution tests

## 🔍 Definition of Done

- [ ] All business logic extracted into dedicated service classes
- [ ] Services implement clear interfaces
- [ ] Service container manages dependencies
- [ ] All services have comprehensive unit tests
- [ ] Integration tests verify service interaction
- [ ] Performance impact measured (< 3ms overhead)
- [ ] Health checks include service status
- [ ] Documentation updated with service architecture

## 📚 References

- [Dependency Injection Patterns](https://en.wikipedia.org/wiki/Dependency_injection)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## 🏷️ Labels
`enhancement` `architecture` `refactoring` `medium-priority`

## 📊 Story Points
**8 points** (1 sprint)

## 🔗 Dependencies
- Should be implemented after Story-12 (auth separation) and Story-15 (error handling)
- Can be done in parallel with Story-13 (config validation)

## 🎯 Success Metrics
- Unit test coverage > 90% for all services
- Service startup time < 100ms
- Zero service-related production incidents
- Developer productivity increased (easier to mock and test) 