import * as jose from 'jose';
import fs from 'fs/promises';
import { UserTokenConfig, UserTokenPayload } from './types.js';
import { UserTokenVerificationError, UserTokenConfigurationError } from './errors.js';

export class UserTokenVerifier {
  private jwksClient?: ReturnType<typeof jose.createRemoteJWKSet>;
  private cachedPublicKey?: jose.KeyLike;

  constructor(private config: UserTokenConfig) {}

  async verify(token: string): Promise<UserTokenPayload> {
    if (this.config.skipVerification) {
      // Development/test mode - return mock user
      return this.config.mockUser || {
        sub: 'dev-user',
        email: 'dev@example.com'
      };
    }

    try {
      // Debug logging for JWT structure
      const payload = jose.decodeJwt(token);
      const protectedHeader = jose.decodeProtectedHeader(token);
      console.log('[JWT] header:', protectedHeader);
      console.log('[JWT] payload:', payload);
      console.log('[JWT] cfg:', this.config);
    } catch (e) {
      console.warn('[JWT] Could not decode token for logging, this may be expected for malformed tokens.', e);
    }

    try {
      const key = await this.getVerificationKey();
      const { payload } = await jose.jwtVerify(
        token,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        key as any,
        {
          issuer: this.config.issuer,
          audience: this.config.audience,
        },
      );

      return { sub: payload.sub! } as UserTokenPayload;
    } catch (error) {
      // Re-throw configuration errors without wrapping
      if (error instanceof UserTokenConfigurationError) {
        console.error('[JWT-ERR]', error.message, error);
        throw error;
      }
      
      // Check if this is specifically a JWT expiration error
      const isExpiredToken = error instanceof Error && 
        (error.name === 'JWTExpired' || 
         error.message.toLowerCase().includes('expired') ||
         error.message.toLowerCase().includes('exp'));
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
      console.error('[JWT-ERR]', errorMessage, error);
      
      // Create a more specific error for expired tokens
      const verificationError = new UserTokenVerificationError(errorMessage, error instanceof Error ? error : undefined);
      
      // Add a flag to indicate this is an expired token for client-side handling
      if (isExpiredToken) {
        (verificationError as any).isExpired = true;
      }
      
      throw verificationError;
    }
  }

  private async getVerificationKey(): Promise<jose.KeyLike | ReturnType<typeof jose.createRemoteJWKSet>> {
    // Prefer static public key if provided
    if (this.config.publicKey) {
      if (!this.cachedPublicKey) {
        let pem = this.config.publicKey;
        // If value starts with file:// treat as path
        if (pem.startsWith('file://')) {
          const path = pem.replace('file://', '');
          pem = await fs.readFile(path, 'utf-8');
        }
        this.cachedPublicKey = await jose.importSPKI(pem, 'RS256');
      }
      return this.cachedPublicKey;
    }

    // Otherwise fallback to remote JWKS
    if (!this.jwksClient) {
      if (!this.config.jwksUri) {
        throw new UserTokenConfigurationError('JWKS URI not configured');
      }
      this.jwksClient = jose.createRemoteJWKSet(new URL(this.config.jwksUri));
    }
    return this.jwksClient;
  }

  clearCache(): void {
    this.jwksClient = undefined;
    this.cachedPublicKey = undefined;
  }
} 