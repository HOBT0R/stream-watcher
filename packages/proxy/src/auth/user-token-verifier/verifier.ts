import * as jose from 'jose';
import fs from 'fs/promises';
import { UserTokenConfig, UserTokenPayload } from './types.js';
import { UserTokenVerificationError, UserTokenConfigurationError } from './errors.js';
import winston from 'winston';

export class UserTokenVerifier {
  private jwksClient?: ReturnType<typeof jose.createRemoteJWKSet>;
  private cachedPublicKey?: jose.KeyLike;

  constructor(
    private config: UserTokenConfig,
    private logger?: winston.Logger
  ) {
    // Validate configuration for production mode
    if (!config.skipVerification && !config.publicKey && !config.jwksUri) {
      throw new UserTokenConfigurationError('Either publicKey or jwksUri must be provided when skipVerification is false');
    }
  }

  async verify(token: string, correlationId?: string): Promise<UserTokenPayload> {
    if (this.config.skipVerification) {
      // Development/test mode - return mock user
      this.logger?.debug('JWT verification skipped - using mock user', {
        event: 'jwt_verification_skipped',
        mockUser: this.config.mockUser,
        correlationId
      });
      
      return this.config.mockUser || {
        sub: 'dev-user',
        email: 'dev@example.com'
      };
    }

    try {
      // Debug logging for JWT structure (replacing console.log)
      const payload = jose.decodeJwt(token);
      const protectedHeader = jose.decodeProtectedHeader(token);
      
      this.logger?.debug('JWT token decoded for verification', {
        event: 'jwt_token_decoded',
        header: protectedHeader,
        payload: {
          sub: payload.sub,
          email: payload.email,
          exp: payload.exp,
          iat: payload.iat
        },
        config: {
          skipVerification: this.config.skipVerification,
          publicKey: this.config.publicKey ? '[PROVIDED]' : undefined,
          jwksUri: this.config.jwksUri,
          issuer: this.config.issuer,
          audience: this.config.audience
        },
        correlationId
      });
    } catch (e) {
      this.logger?.warn('Could not decode JWT token for logging - may be malformed', {
        event: 'jwt_decode_failed',
        error: e instanceof Error ? e.message : 'Unknown error',
        correlationId
      });
    }

    try {
      const key = await this.getVerificationKey(correlationId);
      const { payload } = await jose.jwtVerify(
        token,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        key as any,
        {
          issuer: this.config.issuer,
          audience: this.config.audience,
        },
      );

      this.logger?.info('JWT verification successful', {
        event: 'jwt_verification_success',
        userId: payload.sub,
        email: payload.email,
        correlationId
      });

      return { sub: payload.sub! } as UserTokenPayload;
    } catch (error) {
      // Handle expired token specifically
      if (error instanceof jose.errors.JWTExpired) {
        this.logger?.warn('JWT token has expired', {
          event: 'jwt_token_expired',
          error: error.message,
          correlationId
        });
        
        const expiredError = new UserTokenVerificationError('Token has expired');
        (expiredError as UserTokenVerificationError & { isExpired: boolean }).isExpired = true;
        throw expiredError;
      }
      
      this.logger?.error('JWT verification failed', {
        event: 'jwt_verification_failed',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        correlationId
      });
      
      throw new UserTokenVerificationError(
        `JWT verification failed: ${(error as Error).message}`
      );
    }
  }

  private async getVerificationKey(correlationId?: string): Promise<jose.KeyLike | ReturnType<typeof jose.createRemoteJWKSet>> {
    // Prefer static public key if provided
    if (this.config.publicKey) {
      if (!this.cachedPublicKey) {
        this.logger?.debug('Loading static public key for JWT verification', {
          event: 'jwt_static_key_loading',
          keyType: this.config.publicKey.startsWith('file://') ? 'file' : 'inline',
          correlationId
        });
        
        let pem = this.config.publicKey;
        // If value starts with file:// treat as path
        if (pem.startsWith('file://')) {
          const path = pem.replace('file://', '');
          pem = await fs.readFile(path, 'utf-8');
        }
        this.cachedPublicKey = await jose.importSPKI(pem, 'RS256');
        
        this.logger?.debug('Static public key loaded successfully', {
          event: 'jwt_static_key_loaded',
          correlationId
        });
      }
      return this.cachedPublicKey;
    }

    // Otherwise fallback to remote JWKS
    if (!this.jwksClient) {
      if (!this.config.jwksUri) {
        throw new UserTokenConfigurationError('JWKS URI not configured');
      }
      
      this.logger?.debug('Creating remote JWKS client', {
        event: 'jwt_jwks_client_created',
        jwksUri: this.config.jwksUri,
        correlationId
      });
      
      this.jwksClient = jose.createRemoteJWKSet(new URL(this.config.jwksUri));
    }
    return this.jwksClient;
  }

  clearCache(): void {
    this.jwksClient = undefined;
    this.cachedPublicKey = undefined;
    
    this.logger?.debug('JWT verification cache cleared', {
      event: 'jwt_cache_cleared'
    });
  }
} 