import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserTokenVerifier } from './user-token-verifier/verifier.js';
import { GoogleTokenGenerator } from './google/tokenGenerator.js';
import { UserTokenConfig } from './user-token-verifier/types.js';
import { GoogleAuthConfig } from './google/types.js';
import { AuthenticationError } from './types.js';
import winston from 'winston';

export function createAuthMiddleware(
  userTokenConfig: UserTokenConfig,
  googleConfig: GoogleAuthConfig,
  bffAudience: string,
  logger?: winston.Logger
): RequestHandler {
  const userTokenVerifier = new UserTokenVerifier(userTokenConfig, logger);
  const googleTokenGenerator = new GoogleTokenGenerator(googleConfig, logger);

  return async (req: Request, _res: Response, next: NextFunction) => {
    const requestLogger = req.logger || logger;
    
    try {
      // Phase 1: Firebase JWT verification
      if (userTokenConfig.skipVerification) {
        // Development/test mode - use mock user
        req.user = userTokenConfig.mockUser || {
          sub: 'dev-user',
          email: 'dev@example.com'
        };
        
        requestLogger?.debug('Authentication bypassed - using mock user', {
          event: 'auth_mock_user',
          mockUser: req.user,
          correlationId: req.correlationId
        });
      } else {
        // Production/staging mode - verify JWT
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new AuthenticationError('Authorization header required');
        }

        const token = authHeader.split(' ')[1];
        requestLogger?.debug('Starting JWT verification', {
          event: 'auth_jwt_verification_start',
          correlationId: req.correlationId
        });
        
        req.user = await userTokenVerifier.verify(token, req.correlationId);
        
        requestLogger?.info('JWT verification successful', {
          event: 'auth_jwt_verification_success',
          userId: req.user.sub,
          correlationId: req.correlationId
        });
      }

      // Phase 2: Google service token injection
      if (googleConfig.skipAuth) {
        // Development mode - skip service token injection
        requestLogger?.debug('Google service token injection skipped - development mode', {
          event: 'auth_google_token_skipped',
          correlationId: req.correlationId
        });
      } else {
        requestLogger?.debug('Generating Google service token', {
          event: 'auth_google_token_generation_start',
          audience: bffAudience,
          correlationId: req.correlationId
        });
        
        const serviceToken = await googleTokenGenerator.generateIdToken(bffAudience, req.correlationId);
        req.headers.authorization = `Bearer ${serviceToken}`;
        
        // Structured logging for BFF token (replacing console.log)
        requestLogger?.debug('Google service token attached to request', {
          event: 'auth_google_token_attached',
          audience: bffAudience,
          tokenPreview: serviceToken.substring(0, 20) + '...',
          correlationId: req.correlationId
        });
      }

      next();
    } catch (error) {
      requestLogger?.error('Authentication middleware error', {
        event: 'auth_middleware_error',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        correlationId: req.correlationId
      });
      next(error);
    }
  };
} 