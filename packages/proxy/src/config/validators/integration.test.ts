import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createValidator } from './index.js';

// Mock modules for integration testing
vi.mock('../../auth/middleware.js', () => ({
  createAuthMiddleware: vi.fn()
}));

describe('Configuration Validators Integration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Development Environment', () => {
    it('should validate successfully with minimal configuration', () => {
      const env = {
        NODE_ENV: 'development'
      };

      const validator = createValidator('development');
      const result = validator.validate(env);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0); // Should have warnings for defaults

      const config = validator.getConfig();
      expect(config.port).toBe(8080);
      expect(config.bffTargetUrl.toString()).toBe('http://localhost:3001/');
      expect(config.userToken.skipVerification).toBe(true); // default in development
      expect(config.google.skipAuth).toBe(true);
    });

    it('should allow JWT verification to be skipped', () => {
      const env = {
        NODE_ENV: 'development',
        SKIP_JWT_VERIFY: 'true'
      };

      const validator = createValidator('development');
      const result = validator.validate(env);

      expect(result.isValid).toBe(true);
      const config = validator.getConfig();
      expect(config.userToken.skipVerification).toBe(true);
    });

    it('should use custom BFF URL when provided', () => {
      const env = {
        NODE_ENV: 'development',
        BFF_TARGET_URL: 'http://custom-bff:3000'
      };

      const validator = createValidator('development');
      const result = validator.validate(env);

      expect(result.isValid).toBe(true);
      const config = validator.getConfig();
      expect(config.bffTargetUrl.toString()).toBe('http://custom-bff:3000/');
    });

    it('should handle invalid URLs gracefully', () => {
      const env = {
        NODE_ENV: 'development',
        BFF_TARGET_URL: 'not-a-url'
      };

      const validator = createValidator('development');
      const result = validator.validate(env);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('BFF_TARGET_URL');
      expect(result.errors[0].reason).toBe('is not a valid URL');
    });
  });

  describe('Production Environment', () => {
    it('should fail validation with missing required fields', () => {
      const env = {
        NODE_ENV: 'production'
      };

      const validator = createValidator('production');
      const result = validator.validate(env);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should require BFF configuration
      const bffErrors = result.errors.filter(e => 
        e.field.includes('BFF_TARGET_URL') || e.field.includes('BFF_AUDIENCE')
      );
      expect(bffErrors.length).toBeGreaterThan(0);

      // Should require JWT configuration
      const jwtErrors = result.errors.filter(e => 
        e.field.includes('JWT_')
      );
      expect(jwtErrors.length).toBeGreaterThan(0);

      // Should require Google configuration
      const googleErrors = result.errors.filter(e => 
        e.field.includes('GOOGLE_CLOUD_PROJECT')
      );
      expect(googleErrors.length).toBeGreaterThan(0);
    });

    it('should validate successfully with all required fields', () => {
      const env = {
        NODE_ENV: 'production',
        BFF_TARGET_URL: 'https://api.example.com',
        BFF_AUDIENCE: 'https://api.example.com',
        JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
        JWT_ISSUER: 'https://auth.example.com',
        JWT_AUDIENCE: 'https://api.example.com',
        GOOGLE_CLOUD_PROJECT: 'my-project-123'
      };

      const validator = createValidator('production');
      const result = validator.validate(env);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      const config = validator.getConfig();
      expect(config.port).toBe(8080);
      expect(config.bffTargetUrl.toString()).toBe('https://api.example.com/');
      expect(config.userToken.skipVerification).toBe(false);
      expect(config.userToken.jwksUri?.toString()).toBe('https://auth.example.com/.well-known/jwks.json');
      expect(config.google.skipAuth).toBe(false);
      expect(config.google.projectId).toBe('my-project-123');
    });

    it('should handle APP_CONFIG_JSON format', () => {
      const appConfigJson = JSON.stringify({
        cloudRunUrl: 'https://my-service-hash-uc.a.run.app'
      });

      const env = {
        NODE_ENV: 'production',
        APP_CONFIG_JSON: appConfigJson,
        JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
        JWT_ISSUER: 'https://auth.example.com',
        JWT_AUDIENCE: 'https://api.example.com',
        GOOGLE_CLOUD_PROJECT: 'my-project-123'
      };

      const validator = createValidator('production');
      const result = validator.validate(env);
      expect(result.isValid).toBe(true);

      const config = validator.getConfig();
      expect(config.bffTargetUrl.toString()).toBe('https://my-service-hash-uc.a.run.app/');
      expect(config.bffAudience).toBe('https://my-service-hash-uc.a.run.app'); // String - no trailing slash!
    });

    it('should fail for invalid APP_CONFIG_JSON format', () => {
      const env = {
        NODE_ENV: 'production',
        APP_CONFIG_JSON: 'invalid-json',
        JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
        JWT_ISSUER: 'https://auth.example.com',
        JWT_AUDIENCE: 'https://api.example.com',
        GOOGLE_CLOUD_PROJECT: 'my-project-123',
        BFF_AUDIENCE: 'https://api.example.com'
      };

      const validator = createValidator('production');
      const result = validator.validate(env);

      expect(result.isValid).toBe(false);
      const jsonError = result.errors.find(e => e.field === 'APP_CONFIG_JSON');
      expect(jsonError).toBeDefined();
      expect(jsonError?.reason).toBe('must be valid JSON');
    });

    it('should validate URL protocols correctly', () => {
      const env = {
        NODE_ENV: 'production',
        BFF_TARGET_URL: 'ftp://invalid-protocol.com',
        BFF_AUDIENCE: 'https://api.example.com',
        JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
        JWT_ISSUER: 'https://auth.example.com',
        JWT_AUDIENCE: 'https://api.example.com',
        GOOGLE_CLOUD_PROJECT: 'my-project-123'
      };

      const validator = createValidator('production');
      const result = validator.validate(env);

      expect(result.isValid).toBe(false);
      const protocolError = result.errors.find(e => 
        e.field === 'BFF_TARGET_URL' && e.reason.includes('protocol')
      );
      expect(protocolError).toBeDefined();
    });

    it('should preserve exact string format for JWT audience validation', () => {
      // This test verifies different URL formats are preserved exactly
      
      const testCases = [
        'https://example.com',           // No trailing slash
        'https://example.com/',          // With trailing slash  
        'https://example.com/path',      // With path
        'https://example.com:8080'       // With port
      ];

      for (const testUrl of testCases) {
        const env = {
          NODE_ENV: 'production',
          BFF_TARGET_URL: 'https://api.example.com',
          BFF_AUDIENCE: testUrl,
          JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
          JWT_ISSUER: 'https://auth.example.com',
          JWT_AUDIENCE: 'https://api.example.com',
          GOOGLE_CLOUD_PROJECT: 'my-project-123'
        };

        const validator = createValidator('production');
        const result = validator.validate(env);
        expect(result.isValid).toBe(true);
        
        const validatedConfig = validator.getConfig();
        
        // The exact string format is preserved
        expect(validatedConfig.bffAudience).toBe(testUrl);
      }
    });

    it('should pass correct audience string to auth middleware without normalization', async () => {
      // This integration test verifies the full flow works correctly
      
      const testAudienceUrl = 'https://example.com'; // No trailing slash
      
      const env = {
        NODE_ENV: 'production',
        BFF_TARGET_URL: 'https://api.example.com',
        BFF_AUDIENCE: testAudienceUrl,
        JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
        JWT_ISSUER: 'https://auth.example.com',
        JWT_AUDIENCE: 'https://api.example.com',
        GOOGLE_CLOUD_PROJECT: 'my-project-123'
      };

      const validator = createValidator('production');
      const result = validator.validate(env);
      expect(result.isValid).toBe(true);
      
      const validatedConfig = validator.getConfig();
      
      // Clear all mocks and reset modules to ensure clean test
      vi.clearAllMocks();
      vi.resetModules();
      
      // Import and mock the auth middleware to capture the audience parameter
      const { createAuthMiddleware } = await import('../../auth/middleware.js');
      
      // Create a spy that captures the bffAudience parameter
      const authMiddlewareSpy = vi.fn().mockReturnValue(
        (_req: Request, _res: Response, next: NextFunction) => next()
      );
      vi.mocked(createAuthMiddleware).mockImplementation(authMiddlewareSpy);
      
      // Import and create the app - this will call createAuthMiddleware
      const { createApp } = await import('../../app.js');
      
      // Create the legacy config that app.ts expects
      const legacyConfig = {
        port: validatedConfig.port,
        bffTargetUrl: validatedConfig.bffTargetUrl.toString(),
        bffAudience: validatedConfig.bffAudience, // Now a string - no normalization!
        jwt: {
          skipVerification: validatedConfig.userToken.skipVerification,
          jwksUri: validatedConfig.userToken.jwksUri?.toString() || '',
          issuer: validatedConfig.userToken.issuer || '',
          audience: validatedConfig.userToken.audience || ''
        },
        firebase: {
          projectId: validatedConfig.google.projectId || ''
        }
      };
      
      // Create the app - this should work perfectly now
      createApp(legacyConfig, validatedConfig);
      
      // Verify createAuthMiddleware was called
      expect(authMiddlewareSpy).toHaveBeenCalled();
      
      // Get the actual bffAudience parameter passed to createAuthMiddleware
      const callArgs = authMiddlewareSpy.mock.calls[0];
      const actualBffAudience = callArgs[2]; // Third parameter is bffAudience
      
      // Perfect! The exact string is passed through with no modifications
      expect(actualBffAudience).toBe(testAudienceUrl);
      expect(actualBffAudience).toBe('https://example.com'); // Exact match
      expect(actualBffAudience).not.toMatch(/\/$/); // No trailing slash
    });
  });

  describe('Environment Selection', () => {
    it('should use development validator for test environment', () => {
      const validator = createValidator('test');
      const result = validator.validate({});
      
      expect(result.isValid).toBe(true); // Development validator is more lenient
      const config = validator.getConfig();
      expect(config.google.skipAuth).toBe(true);
    });

    it('should use production validator for staging environment', () => {
      const validator = createValidator('staging');
      const result = validator.validate({});
      
      expect(result.isValid).toBe(false); // Production validator is strict
    });

    it('should default to development validator for unknown environment', () => {
      const validator = createValidator('unknown-env');
      const result = validator.validate({});
      
      expect(result.isValid).toBe(true);
      const config = validator.getConfig();
      expect(config.google.skipAuth).toBe(true);
    });
  });

  describe('URL Normalization Bug Detection', () => {
    it('should demonstrate the fix - bffAudience is now stored as string', () => {
      // This test shows that we fixed the URL trailing slash bug by storing as string
      
      const testAudienceUrl = 'https://example.com'; // No trailing slash
      
      const env = {
        NODE_ENV: 'production',
        BFF_TARGET_URL: 'https://api.example.com',
        BFF_AUDIENCE: testAudienceUrl,
        JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
        JWT_ISSUER: 'https://auth.example.com',
        JWT_AUDIENCE: 'https://api.example.com',
        GOOGLE_CLOUD_PROJECT: 'my-project-123'
      };

      const validator = createValidator('production');
      const result = validator.validate(env);
      expect(result.isValid).toBe(true);
      
      const validatedConfig = validator.getConfig();
      
      // 1. bffAudience is now stored as a string (not URL object)
      expect(validatedConfig.bffAudience).toBe(testAudienceUrl);
      expect(typeof validatedConfig.bffAudience).toBe('string');
      
      // 2. No trailing slash normalization occurs
      expect(validatedConfig.bffAudience).toBe('https://example.com'); // Exact match!
      expect(validatedConfig.bffAudience).not.toMatch(/\/$/); // No trailing slash
      
      // 3. The configuration is still validated as a proper URL (just not stored as one)
      expect(() => new URL(validatedConfig.bffAudience)).not.toThrow();
    });

    it('should preserve exact string format for JWT audience validation', () => {
      // This test verifies different URL formats are preserved exactly
      
      const testCases = [
        'https://example.com',           // No trailing slash
        'https://example.com/',          // With trailing slash  
        'https://example.com/path',      // With path
        'https://example.com:8080'       // With port
      ];

      for (const testUrl of testCases) {
        const env = {
          NODE_ENV: 'production',
          BFF_TARGET_URL: 'https://api.example.com',
          BFF_AUDIENCE: testUrl,
          JWT_JWKS_URI: 'https://auth.example.com/.well-known/jwks.json',
          JWT_ISSUER: 'https://auth.example.com',
          JWT_AUDIENCE: 'https://api.example.com',
          GOOGLE_CLOUD_PROJECT: 'my-project-123'
        };

        const validator = createValidator('production');
        const result = validator.validate(env);
        expect(result.isValid).toBe(true);
        
        const validatedConfig = validator.getConfig();
        
        // The exact string format is preserved
        expect(validatedConfig.bffAudience).toBe(testUrl);
      }
    });
  });
}); 