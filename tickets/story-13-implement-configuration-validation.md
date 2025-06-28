# Story-13: Implement Configuration Validation

## 📋 Story Overview

**As a** DevOps engineer deploying the proxy service  
**I want** comprehensive configuration validation at startup  
**So that** misconfigurations are caught early and provide clear error messages for troubleshooting

## 🎯 Acceptance Criteria

### Must Have
- [ ] All environment variables validated at startup with clear error messages
- [ ] Validation failures prevent server startup (fail-fast principle)
- [ ] Required vs optional configuration clearly documented
- [ ] URL format validation (BFF_TARGET_URL, JWT_JWKS_URI)
- [ ] Startup health check endpoint that includes config validation status
- [ ] Configuration schema with TypeScript types

### Should Have
- [ ] Environment-specific validation (dev vs production requirements)
- [ ] Default value fallbacks for optional configurations
- [ ] Validation warnings for deprecated config options
- [ ] Configuration summary logged at startup (sanitized)

### Could Have
- [ ] Configuration reload without restart (for select non-critical configs)
- [ ] Configuration drift detection
- [ ] Integration with external config validation services

## 🏗️ Technical Design

### Current State
```typescript
// config.ts - Basic config with minimal validation
export function getConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? '8080'),
    bffTargetUrl: process.env.BFF_TARGET_URL ?? '',
    // ... other configs without validation
  };
}
```

### Target State
```typescript
// config/validation.ts
export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigError[];
  warnings: ConfigWarning[];
}

export class ConfigValidator {
  validate(env: NodeJS.ProcessEnv): ConfigValidationResult;
  validateUrl(url: string, fieldName: string): ValidationError | null;
  validatePort(port: string, fieldName: string): ValidationError | null;
}

// config/schema.ts
export interface ValidatedAppConfig {
  readonly port: number;
  readonly bffTargetUrl: URL;
  readonly userToken: ValidatedUserTokenConfig;
  readonly google: ValidatedGoogleConfig;
}
```

## 🔧 Implementation Plan

### Phase 1: Create Validation Infrastructure (2 hours)

1. **Create validation module structure**
   ```bash
   mkdir -p src/config
   touch src/config/{validation.ts,schema.ts,errors.ts,defaults.ts}
   ```

2. **Define validation types**
   ```typescript
   // src/config/errors.ts
   export class ConfigError extends Error {
     constructor(
       public field: string,
       public value: string | undefined,
       public reason: string
     ) {
       super(`Configuration error in ${field}: ${reason}`);
     }
   }
   
   export class ConfigWarning {
     constructor(
       public field: string,
       public message: string
     ) {}
   }
   ```

3. **Create base validator**
   ```typescript
   // src/config/validation.ts
   export class ConfigValidator {
     private errors: ConfigError[] = [];
     private warnings: ConfigWarning[] = [];
   
     required(value: string | undefined, field: string): string {
       if (!value || value.trim() === '') {
         this.errors.push(new ConfigError(field, value, 'is required'));
         return '';
       }
       return value.trim();
     }
   
     optional(value: string | undefined, defaultValue: string, field: string): string {
       if (!value || value.trim() === '') {
         this.warnings.push(new ConfigWarning(field, `using default: ${defaultValue}`));
         return defaultValue;
       }
       return value.trim();
     }
   
     validateUrl(value: string, field: string): URL {
       try {
         const url = new URL(value);
         if (!['http:', 'https:'].includes(url.protocol)) {
           this.errors.push(new ConfigError(field, value, 'must use http or https protocol'));
         }
         return url;
       } catch (error) {
         this.errors.push(new ConfigError(field, value, 'is not a valid URL'));
         return new URL('http://invalid');
       }
     }
   
     validatePort(value: string | undefined, field: string, defaultPort: number = 8080): number {
       const port = parseInt(value || defaultPort.toString());
       if (isNaN(port) || port < 1 || port > 65535) {
         this.errors.push(new ConfigError(field, value, 'must be a valid port number (1-65535)'));
         return defaultPort;
       }
       return port;
     }
   
     getResult(): ConfigValidationResult {
       return {
         isValid: this.errors.length === 0,
         errors: [...this.errors],
         warnings: [...this.warnings]
       };
     }
   }
   ```

### Phase 2: Environment-Specific Validation (1.5 hours)

1. **Define environment schemas**
   ```typescript
   // src/config/schema.ts
   export interface BaseConfig {
     port: number;
     bffTargetUrl: URL;
   }
   
   export interface DevelopmentConfig extends BaseConfig {
     userToken: {
       skipVerification: true;
       publicKey?: string;
     };
     google: {
       skipAuth: true;
     };
   }
   
   export interface ProductionConfig extends BaseConfig {
     userToken: {
       skipVerification: false;
       jwksUri: URL;
       issuer: string;
       audience: string;
     };
     google: {
       skipAuth: false;
       projectId: string;
       audience: string;
     };
   }
   ```

2. **Environment-specific validators**
   ```typescript
   // src/config/validators/
   export class DevelopmentValidator extends ConfigValidator {
     validate(env: NodeJS.ProcessEnv): DevelopmentConfig {
       // More lenient validation for development
       return {
         port: this.validatePort(env.PORT, 'PORT', 8080),
         bffTargetUrl: this.validateUrl(
           env.BFF_TARGET_URL || 'http://localhost:3000',
           'BFF_TARGET_URL'
         ),
         userToken: {
           skipVerification: true,
           publicKey: env.JWT_PUBLIC_KEY // optional in dev
         },
         google: {
           skipAuth: true
         }
       };
     }
   }
   
   export class ProductionValidator extends ConfigValidator {
     validate(env: NodeJS.ProcessEnv): ProductionConfig {
       // Strict validation for production
       return {
         port: this.validatePort(env.PORT, 'PORT', 8080),
         bffTargetUrl: this.validateUrl(
           this.required(env.BFF_TARGET_URL, 'BFF_TARGET_URL'),
           'BFF_TARGET_URL'
         ),
         userToken: {
           skipVerification: false,
           jwksUri: this.validateUrl(
             this.required(env.JWT_JWKS_URI, 'JWT_JWKS_URI'),
             'JWT_JWKS_URI'
           ),
           issuer: this.required(env.JWT_ISSUER, 'JWT_ISSUER'),
           audience: this.required(env.JWT_AUDIENCE, 'JWT_AUDIENCE')
         },
         google: {
           skipAuth: false,
           projectId: this.required(env.GOOGLE_CLOUD_PROJECT, 'GOOGLE_CLOUD_PROJECT'),
           audience: this.required(env.BFF_AUDIENCE, 'BFF_AUDIENCE')
         }
       };
     }
   }
   ```

### Phase 3: Integration with App Startup (1 hour)

1. **Update main config.ts**
   ```typescript
   // src/config.ts
   import { createValidator } from './config/validation.js';
   
   export function getValidatedConfig(): ValidatedAppConfig {
     const environment = process.env.NODE_ENV || 'development';
     const validator = createValidator(environment);
     const result = validator.validate(process.env);
   
     if (!result.isValid) {
       console.error('❌ Configuration validation failed:');
       result.errors.forEach(error => console.error(`  • ${error.message}`));
       process.exit(1);
     }
   
     if (result.warnings.length > 0) {
       console.warn('⚠️  Configuration warnings:');
       result.warnings.forEach(warning => 
         console.warn(`  • ${warning.field}: ${warning.message}`)
       );
     }
   
     return validator.getConfig();
   }
   ```

2. **Update app.ts startup**
   ```typescript
   // src/app.ts
   export function createApp(): Express {
     const config = getValidatedConfig(); // Validates or exits
     console.log('✅ Configuration validated successfully');
   
     // ... rest of app creation
   }
   ```

### Phase 4: Health Check Endpoint (30 minutes)

```typescript
// Add to app.ts
app.get('/health', (req, res) => {
  const configHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      bffTargetReachable: true, // Could add actual connectivity check
      authConfigured: !!process.env.JWT_ISSUER,
      googleAuthConfigured: process.env.NODE_ENV === 'production' ? !!process.env.GOOGLE_APPLICATION_CREDENTIALS : true
    }
  };
  
  res.json(configHealth);
});
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// src/config/validation.test.ts
describe('ConfigValidator', () => {
  describe('URL validation', () => {
    it('should accept valid https URLs');
    it('should reject non-http protocols');
    it('should reject malformed URLs');
    it('should provide helpful error messages');
  });

  describe('Port validation', () => {
    it('should accept valid port numbers');
    it('should reject ports outside valid range');
    it('should use default for invalid ports');
  });

  describe('Environment-specific validation', () => {
    it('should require JWT config in production');
    it('should allow missing JWT config in development');
    it('should validate Google auth config in production');
  });
});
```

### Integration Tests
```typescript
// src/config/integration.test.ts
describe('Configuration Integration', () => {
  it('should start successfully with valid production config');
  it('should exit with error code 1 for invalid config');
  it('should log helpful error messages for missing required fields');
  it('should apply default values correctly');
});
```

### End-to-End Tests
```typescript
// test/e2e/startup.test.ts
describe('Application Startup', () => {
  it('should fail fast with invalid BFF_TARGET_URL');
  it('should start with minimal development config');
  it('should validate all production requirements');
});
```

## ⚠️ Gotchas & Risks

### High Risk
1. **Breaking Changes to Existing Deployments**
   - Risk: New validation might reject currently working configs
   - Mitigation: Test against all existing environment configs first
   - Test: Validate against current staging/production configs

2. **Startup Time Impact**
   - Risk: Validation might slow down container startup
   - Mitigation: Keep validation logic lightweight, no network calls
   - Test: Measure startup time before/after implementation

### Medium Risk
1. **Environment Variable Naming Consistency**
   - Risk: Validation might reveal inconsistent naming patterns
   - Mitigation: Document all name changes, provide migration guide
   - Test: Cross-reference all environment files

2. **Default Value Changes**
   - Risk: New defaults might alter behavior
   - Mitigation: Explicitly test all default behaviors
   - Test: Compare behaviors with/without explicit values

### Low Risk
1. **Log Message Format**
   - Risk: Different log formats might break log parsing
   - Mitigation: Use structured logging format
   - Test: Validate log parsing in CI/monitoring

## 🔍 Definition of Done

- [ ] All environment variables validated with appropriate error messages
- [ ] Application fails fast on invalid configuration
- [ ] Health check endpoint includes config validation status
- [ ] All tests pass (unit, integration, e2e)
- [ ] Documentation updated with new validation requirements
- [ ] Backwards compatibility maintained for existing deployments
- [ ] Performance impact measured (< 100ms additional startup time)
- [ ] Code review completed
- [ ] Deployed and validated in staging environment

## 📚 References

- [12-Factor App Configuration](https://12factor.net/config)
- [Node.js Environment Variables Best Practices](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [TypeScript Configuration Patterns](https://www.typescriptlang.org/docs/handbook/interfaces.html)

## 🏷️ Labels
`enhancement` `configuration` `reliability` `medium-priority`

## 📊 Story Points
**5 points** (1 sprint)

## 🔗 Dependencies
- Should be implemented after Story-12 (auth separation) for cleaner config organization

## 🎯 Success Metrics
- Zero configuration-related production incidents
- 100% of configuration errors caught at startup
- Developer setup time reduced by 50% (clearer error messages)
- Health check response time < 10ms 