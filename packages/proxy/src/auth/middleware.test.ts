import '../test-setup.js';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from './middleware.js';
import { UserTokenConfig } from './user-token-verifier/types.js';
import { GoogleAuthConfig } from './google/types.js';
import { AuthenticationError } from './types.js';

describe('Unified Auth Middleware', () => {
  let mockRequest: Partial<Request & { user?: any }>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = { headers: {} };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn() as unknown as NextFunction;
  });

  describe('Development Environment', () => {
    it('should bypass Firebase auth and skip Google auth', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: true,
        mockUser: {
          sub: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Dev User'
        }
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: true,
        mockToken: 'dev-token'
      };

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.user).toEqual({
        sub: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Dev User'
      });
      // Should not modify authorization header in dev mode
      expect(mockRequest.headers!.authorization).toBeUndefined();
    });

    it('should use default mock user when none configured', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: true
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: true
      };

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.user).toEqual({
        sub: 'dev-user',
        email: 'dev@example.com'
      });
    });
  });

  describe('Production Environment', () => {
    it('should verify Firebase JWT and inject Google token', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: false,
        issuer: 'test-issuer',
        audience: 'test-audience'
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: false,
        projectId: 'test-project'
      };

      // Mock the Firebase verifier to return a user
      const originalFirebaseVerifier = await import('./user-token-verifier/verifier.js');
      vi.spyOn(originalFirebaseVerifier, 'UserTokenVerifier').mockImplementation(() => ({
        verify: vi.fn().mockResolvedValue({ sub: 'verified-user-123' }),
        clearCache: vi.fn()
      } as any));

      // Mock the Google token generator
      const originalGoogleGenerator = await import('./google/tokenGenerator.js');
      vi.spyOn(originalGoogleGenerator, 'GoogleTokenGenerator').mockImplementation(() => ({
        generateIdToken: vi.fn().mockResolvedValue('google-service-token')
      } as any));

      mockRequest.headers!.authorization = 'Bearer valid-firebase-jwt';

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.user).toEqual({ sub: 'verified-user-123' });
      expect(mockRequest.headers!.authorization).toBe('Bearer google-service-token');
    });

    it('should throw AuthenticationError when no authorization header', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: false
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: false
      };

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthenticationError));
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authorization header required'
        })
      );
    });

    it('should throw AuthenticationError when authorization header malformed', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: false
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: false
      };

      mockRequest.headers!.authorization = 'Malformed header';

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should handle Firebase verification errors', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: false
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: false
      };

      // Mock Firebase verifier to throw an error
      const originalFirebaseVerifier = await import('./user-token-verifier/verifier.js');
      vi.spyOn(originalFirebaseVerifier, 'UserTokenVerifier').mockImplementation(() => ({
        verify: vi.fn().mockRejectedValue(new Error('JWT verification failed')),
        clearCache: vi.fn()
      } as any));

      mockRequest.headers!.authorization = 'Bearer invalid-jwt';

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle Google token generation errors', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: false
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: false
      };

      // Mock Firebase verifier to succeed
      const originalFirebaseVerifier = await import('./user-token-verifier/verifier.js');
      vi.spyOn(originalFirebaseVerifier, 'UserTokenVerifier').mockImplementation(() => ({
        verify: vi.fn().mockResolvedValue({ sub: 'user-123' }),
        clearCache: vi.fn()
      } as any));

      // Mock Google generator to fail
      const originalGoogleGenerator = await import('./google/tokenGenerator.js');
      vi.spyOn(originalGoogleGenerator, 'GoogleTokenGenerator').mockImplementation(() => ({
        generateIdToken: vi.fn().mockRejectedValue(new Error('Token generation failed'))
      } as any));

      mockRequest.headers!.authorization = 'Bearer valid-jwt';

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should log debug token when LOG_BFF_TOKEN is enabled', async () => {
      const originalEnv = process.env.LOG_BFF_TOKEN;
      process.env.LOG_BFF_TOKEN = 'true';
      
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const userTokenConfig: UserTokenConfig = {
        skipVerification: false
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: false
      };

      // Mock successful auth flow
      const originalFirebaseVerifier = await import('./user-token-verifier/verifier.js');
      vi.spyOn(originalFirebaseVerifier, 'UserTokenVerifier').mockImplementation(() => ({
        verify: vi.fn().mockResolvedValue({ sub: 'user-123' }),
        clearCache: vi.fn()
      } as any));

      const originalGoogleGenerator = await import('./google/tokenGenerator.js');
      vi.spyOn(originalGoogleGenerator, 'GoogleTokenGenerator').mockImplementation(() => ({
        generateIdToken: vi.fn().mockResolvedValue('debug-token-12345')
      } as any));

      mockRequest.headers!.authorization = 'Bearer valid-jwt';

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Auth → BFF] Outgoing Bearer token (pre-proxy):',
        'debug-token-12345'
      );

      consoleLogSpy.mockRestore();
      process.env.LOG_BFF_TOKEN = originalEnv;
    });
  });

  describe('Mixed Environment Configurations', () => {
    it('should skip Firebase auth but enable Google auth', async () => {
      const userTokenConfig: UserTokenConfig = {
        skipVerification: true,
        mockUser: { sub: 'dev-user', email: 'dev@example.com' }
      };

      const googleConfig: GoogleAuthConfig = {
        skipAuth: false,
        projectId: 'test-project'
      };

      // Mock Google token generator
      const originalGoogleGenerator = await import('./google/tokenGenerator.js');
      vi.spyOn(originalGoogleGenerator, 'GoogleTokenGenerator').mockImplementation(() => ({
        generateIdToken: vi.fn().mockResolvedValue('real-service-token')
      } as any));

      const middleware = createAuthMiddleware(userTokenConfig, googleConfig, 'test-audience');
      
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.user).toEqual({ sub: 'dev-user', email: 'dev@example.com' });
      expect(mockRequest.headers!.authorization).toBe('Bearer real-service-token');
    });
  });
}); 