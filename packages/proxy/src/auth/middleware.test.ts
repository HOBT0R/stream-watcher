import '../test-setup.js';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from './middleware.js';
import { UserTokenConfig } from './user-token-verifier/types.js';
import { GoogleAuthConfig } from './google/types.js';

// Mock the auth modules
vi.mock('./user-token-verifier/verifier.js');
vi.mock('./google/tokenGenerator.js');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    mockNext = vi.fn() as NextFunction;
    
    vi.clearAllMocks();
  });

  describe('Development Environment', () => {
    const devUserTokenConfig: UserTokenConfig = {
      skipVerification: true,
      mockUser: {
        sub: 'dev-user-123',
        email: 'developer@example.com',
        name: 'Development User'
      }
    };

    const devGoogleConfig: GoogleAuthConfig = {
      skipAuth: true,
      mockToken: 'dev-service-token'
    };

    it('should use mock user when user token verification is skipped', async () => {
      const middleware = createAuthMiddleware(
        devUserTokenConfig,
        devGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        sub: 'dev-user-123',
        email: 'developer@example.com',
        name: 'Development User'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use default mock user when mockUser is not configured', async () => {
      const configWithoutMockUser: UserTokenConfig = {
        skipVerification: true
      };

      const middleware = createAuthMiddleware(
        configWithoutMockUser,
        devGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        sub: 'dev-user',
        email: 'dev@example.com'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip Google service token injection in development', async () => {
      const middleware = createAuthMiddleware(
        devUserTokenConfig,
        devGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Should not modify authorization header in dev mode
      expect(mockRequest.headers?.authorization).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Production Environment', () => {
    const prodUserTokenConfig: UserTokenConfig = {
      skipVerification: false,
      jwksUri: 'https://example.com/.well-known/jwks.json',
      issuer: 'https://securetoken.google.com/test-project',
      audience: 'test-project'
    };

    const prodGoogleConfig: GoogleAuthConfig = {
      skipAuth: false,
      projectId: 'test-project',
      audience: 'test-audience'
    };

    it('should verify user token and inject Google service token', async () => {
      // Mock successful user token verification
      const { UserTokenVerifier } = await import('./user-token-verifier/verifier.js');
      const mockVerify = vi.fn().mockResolvedValue({
        sub: 'user-123',
        email: 'user@example.com'
      });
      vi.mocked(UserTokenVerifier).mockImplementation(() => ({
        verify: mockVerify
      }) as unknown as InstanceType<typeof UserTokenVerifier>);

      // Mock successful Google token generation
      const { GoogleTokenGenerator } = await import('./google/tokenGenerator.js');
      const mockGenerateIdToken = vi.fn().mockResolvedValue('google-service-token');
      vi.mocked(GoogleTokenGenerator).mockImplementation(() => ({
        generateIdToken: mockGenerateIdToken
      }) as unknown as InstanceType<typeof GoogleTokenGenerator>);

      mockRequest.headers = {
        authorization: 'Bearer user-jwt-token'
      };

      const middleware = createAuthMiddleware(
        prodUserTokenConfig,
        prodGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVerify).toHaveBeenCalledWith('user-jwt-token');
      expect(mockRequest.user).toEqual({
        sub: 'user-123',
        email: 'user@example.com'
      });
      expect(mockGenerateIdToken).toHaveBeenCalledWith('test-audience');
      expect(mockRequest.headers?.authorization).toBe('Bearer google-service-token');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle missing authorization header', async () => {
      const middleware = createAuthMiddleware(
        prodUserTokenConfig,
        prodGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Authorization header required');
    });

    it('should handle malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token'
      };

      const middleware = createAuthMiddleware(
        prodUserTokenConfig,
        prodGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Authorization header required');
    });

    it('should handle user token verification failure', async () => {
      const { UserTokenVerifier } = await import('./user-token-verifier/verifier.js');
      const mockVerify = vi.fn().mockRejectedValue(new Error('Invalid token'));
      vi.mocked(UserTokenVerifier).mockImplementation(() => ({
        verify: mockVerify
      }) as unknown as InstanceType<typeof UserTokenVerifier>);

      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      const middleware = createAuthMiddleware(
        prodUserTokenConfig,
        prodGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle Google token generation failure', async () => {
      // Mock successful user token verification
      const { UserTokenVerifier } = await import('./user-token-verifier/verifier.js');
      const mockVerify = vi.fn().mockResolvedValue({
        sub: 'user-123',
        email: 'user@example.com'
      });
      vi.mocked(UserTokenVerifier).mockImplementation(() => ({
        verify: mockVerify
      }) as unknown as InstanceType<typeof UserTokenVerifier>);

      // Mock failed Google token generation
      const { GoogleTokenGenerator } = await import('./google/tokenGenerator.js');
      const mockGenerateIdToken = vi.fn().mockRejectedValue(new Error('Google Auth failed'));
      vi.mocked(GoogleTokenGenerator).mockImplementation(() => ({
        generateIdToken: mockGenerateIdToken
      }) as unknown as InstanceType<typeof GoogleTokenGenerator>);

      mockRequest.headers = {
        authorization: 'Bearer user-jwt-token'
      };

      const middleware = createAuthMiddleware(
        prodUserTokenConfig,
        prodGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Mixed Environment Configurations', () => {
    it('should handle dev user token with prod Google auth', async () => {
      const devUserConfig: UserTokenConfig = {
        skipVerification: true,
        mockUser: { sub: 'dev-user', email: 'dev@example.com' }
      };

      const prodGoogleConfig: GoogleAuthConfig = {
        skipAuth: false,
        projectId: 'test-project'
      };

      const { GoogleTokenGenerator } = await import('./google/tokenGenerator.js');
      const mockGenerateIdToken = vi.fn().mockResolvedValue('real-google-token');
      vi.mocked(GoogleTokenGenerator).mockImplementation(() => ({
        generateIdToken: mockGenerateIdToken
      }) as unknown as InstanceType<typeof GoogleTokenGenerator>);

      const middleware = createAuthMiddleware(
        devUserConfig,
        prodGoogleConfig,
        'test-audience'
      );

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        sub: 'dev-user',
        email: 'dev@example.com'
      });
      expect(mockGenerateIdToken).toHaveBeenCalledWith('test-audience');
      expect(mockRequest.headers?.authorization).toBe('Bearer real-google-token');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
}); 