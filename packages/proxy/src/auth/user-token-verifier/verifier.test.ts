import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserTokenVerifier } from './verifier.js';
import { UserTokenConfig } from './types.js';
import { UserTokenVerificationError, UserTokenConfigurationError } from './errors.js';
import * as jose from 'jose';

// Mock the jose library
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  createRemoteJWKSet: vi.fn(),
  importSPKI: vi.fn(),
  decodeJwt: vi.fn(),
  decodeProtectedHeader: vi.fn(),
  errors: {
    JWTExpired: class JWTExpired extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'JWTExpired';
      }
    }
  }
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
          sub: 'mock-user-123',
          email: 'mock@example.com',
          name: 'Mock User'
        }
      };
      
      const verifier = new UserTokenVerifier(config);
      const result = await verifier.verify('any-token');

      expect(result).toEqual({
        sub: 'mock-user-123',
        email: 'mock@example.com',
        name: 'Mock User'
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
      
      // This should throw during construction, not during verify
      expect(() => new UserTokenVerifier(config)).toThrow(UserTokenConfigurationError);
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
      vi.mocked(decodeJwt).mockReturnValue({
        sub: 'user-123',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200  // Issued 2 hours ago
      });
      
      vi.mocked(decodeProtectedHeader).mockReturnValue({
        alg: 'RS256',
        typ: 'JWT'
      });

      // Mock successful key import
      const mockKey = { type: 'public' };
      vi.mocked(importSPKI).mockResolvedValue(mockKey);

      // Mock jwtVerify to throw a JWT expiration error (this is what JOSE throws for expired tokens)
      const expiredError = new jose.errors.JWTExpired('JWT expired');
      vi.mocked(jwtVerify).mockRejectedValue(expiredError);

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
        expect((error as UserTokenVerificationError).message).toContain('Token has expired');
        // The UserTokenVerificationError doesn't store the original error
        // Verify the expired flag is set for automatic logout handling
        expect((error as UserTokenVerificationError & { isExpired?: boolean }).isExpired).toBe(true);
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

  describe('Configuration Validation', () => {
    it('should throw UserTokenConfigurationError when no verification method provided', () => {
      const config: UserTokenConfig = {
        skipVerification: false
        // Missing both publicKey and jwksUri
      };

      expect(() => new UserTokenVerifier(config)).toThrow('Either publicKey or jwksUri must be provided when skipVerification is false');
    });

    it('should accept config with publicKey', () => {
      const config: UserTokenConfig = {
        skipVerification: false,
        publicKey: 'test-public-key',
        issuer: 'test-issuer',
        audience: 'test-audience'
      };

      expect(() => new UserTokenVerifier(config)).not.toThrow();
    });

    it('should accept config with jwksUri', () => {
      const config: UserTokenConfig = {
        skipVerification: false,
        jwksUri: 'https://example.com/.well-known/jwks.json',
        issuer: 'test-issuer',
        audience: 'test-audience'
      };

      expect(() => new UserTokenVerifier(config)).not.toThrow();
    });
  });

  describe('JWT Verification', () => {
    it('should verify JWT successfully with JWKS', async () => {
      const config: UserTokenConfig = {
        skipVerification: false,
        jwksUri: 'https://example.com/.well-known/jwks.json',
        issuer: 'test-issuer',
        audience: 'test-audience'
      };

      const mockJWKS = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(jose.createRemoteJWKSet).mockReturnValue(mockJWKS as any);
      
      const mockPayload = { sub: 'user-123', iss: 'test-issuer', aud: 'test-audience' };
      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        key: {} as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const verifier = new UserTokenVerifier(config);
      const result = await verifier.verify('valid-jwt-token');

      expect(result).toEqual({ sub: 'user-123' });
      expect(jose.createRemoteJWKSet).toHaveBeenCalledWith(new URL('https://example.com/.well-known/jwks.json'));
      expect(jose.jwtVerify).toHaveBeenCalledWith('valid-jwt-token', mockJWKS, {
        issuer: 'test-issuer',
        audience: 'test-audience'
      });
    });

    it('should handle expired JWT tokens specifically', async () => {
      const config: UserTokenConfig = {
        skipVerification: false,
        jwksUri: 'https://example.com/.well-known/jwks.json',
        issuer: 'test-issuer',
        audience: 'test-audience'
      };

      const mockJWKS = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(jose.createRemoteJWKSet).mockReturnValue(mockJWKS as any);
      
      const expiredError = new jose.errors.JWTExpired('JWT expired');
      vi.mocked(jose.jwtVerify).mockRejectedValue(expiredError);

      const verifier = new UserTokenVerifier(config);
      
      try {
        await verifier.verify('expired-jwt-token');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(UserTokenVerificationError);
        expect((error as UserTokenVerificationError).message).toContain('Token has expired');
        expect((error as UserTokenVerificationError & { isExpired?: boolean }).isExpired).toBe(true);
      }
    });

    it('should handle general JWT verification errors', async () => {
      const config: UserTokenConfig = {
        skipVerification: false,
        jwksUri: 'https://example.com/.well-known/jwks.json',
        issuer: 'test-issuer',
        audience: 'test-audience'
      };

      const mockJWKS = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(jose.createRemoteJWKSet).mockReturnValue(mockJWKS as any);
      
      const verificationError = new Error('Invalid signature');
      vi.mocked(jose.jwtVerify).mockRejectedValue(verificationError);

      const verifier = new UserTokenVerifier(config);
      
      await expect(verifier.verify('invalid-jwt-token'))
        .rejects
        .toThrow(UserTokenVerificationError);
    });
  });
}); 