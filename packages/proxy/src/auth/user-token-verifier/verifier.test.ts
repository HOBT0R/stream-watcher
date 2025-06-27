import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserTokenVerifier } from './verifier.js';
import { UserTokenConfig } from './types.js';
import { UserTokenVerificationError, UserTokenConfigurationError } from './errors.js';

// Mock jose library
vi.mock('jose', () => ({
  decodeJwt: vi.fn(),
  decodeProtectedHeader: vi.fn(),
  jwtVerify: vi.fn(),
  createRemoteJWKSet: vi.fn(),
  importSPKI: vi.fn(),
  KeyLike: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}));

describe('UserTokenVerifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Development Mode (skipVerification: true)', () => {
    it('should return mock user when verification is skipped', async () => {
      const config: UserTokenConfig = {
        skipVerification: true,
        mockUser: {
          sub: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Development User'
        }
      };
      
      const verifier = new UserTokenVerifier(config);
      const result = await verifier.verify('any-token');

      expect(result).toEqual({
        sub: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User'
      });
    });

    it('should return default mock user when none configured', async () => {
      const config: UserTokenConfig = {
        skipVerification: true
      };
      
      const verifier = new UserTokenVerifier(config);
      const result = await verifier.verify('any-token');

      expect(result).toEqual({
        sub: 'dev-user',
        email: 'dev@example.com'
      });
    });
  });

  describe('Production Mode (skipVerification: false)', () => {
    it('should throw UserTokenConfigurationError when no key configured', async () => {
      const config: UserTokenConfig = {
        skipVerification: false
      };
      
      const verifier = new UserTokenVerifier(config);
      
      await expect(verifier.verify('invalid-token')).rejects.toThrow(
        UserTokenConfigurationError
      );
    });

    it('should throw UserTokenVerificationError for invalid tokens', async () => {
      const config: UserTokenConfig = {
        skipVerification: false,
        publicKey: 'invalid-key'
      };
      
      const verifier = new UserTokenVerifier(config);
      
      await expect(verifier.verify('invalid-token')).rejects.toThrow(
        UserTokenVerificationError
      );
    });

    it('should throw UserTokenVerificationError for expired JWT tokens and mark as expired', async () => {
      const { jwtVerify, importSPKI, decodeJwt, decodeProtectedHeader } = await import('jose');
      
      // Mock successful token decoding for logging (these won't throw)
      (decodeJwt as any).mockReturnValue({
        sub: 'user-123',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200  // Issued 2 hours ago
      });
      
      (decodeProtectedHeader as any).mockReturnValue({
        alg: 'RS256',
        typ: 'JWT'
      });

      // Mock successful key import
      const mockKey = { type: 'public' };
      (importSPKI as any).mockResolvedValue(mockKey);

      // Mock jwtVerify to throw a JWT expiration error (this is what JOSE throws for expired tokens)
      const expiredError = new Error('JWT expired');
      expiredError.name = 'JWTExpired';
      (jwtVerify as any).mockRejectedValue(expiredError);

      const config: UserTokenConfig = {
        skipVerification: false,
        publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890...
-----END PUBLIC KEY-----`,
        issuer: 'https://test-issuer.com',
        audience: 'test-audience'
      };
      
      const verifier = new UserTokenVerifier(config);
      
      await expect(verifier.verify('expired.jwt.token')).rejects.toThrow(
        UserTokenVerificationError
      );
      
      // Verify the error was wrapped properly and marked as expired
      try {
        await verifier.verify('expired.jwt.token');
      } catch (error) {
        expect(error).toBeInstanceOf(UserTokenVerificationError);
        expect((error as UserTokenVerificationError).message).toContain('JWT expired');
        expect((error as UserTokenVerificationError).originalError).toBe(expiredError);
        // Verify the expired flag is set for automatic logout handling
        expect((error as any).isExpired).toBe(true);
      }
    });

    it('should clear cache when requested', async () => {
      const config: UserTokenConfig = {
        skipVerification: false,
        publicKey: 'test-key'
      };
      
      const verifier = new UserTokenVerifier(config);
      
      // clearCache should not throw
      expect(() => verifier.clearCache()).not.toThrow();
    });
  });
}); 