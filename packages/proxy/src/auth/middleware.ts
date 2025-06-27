import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserTokenVerifier } from './user-token-verifier/verifier.js';
import { GoogleTokenGenerator } from './google/tokenGenerator.js';
import { UserTokenConfig } from './user-token-verifier/types.js';
import { GoogleAuthConfig } from './google/types.js';
import { AuthenticationError } from './types.js';

export function createAuthMiddleware(
  userTokenConfig: UserTokenConfig,
  googleConfig: GoogleAuthConfig,
  bffAudience: string
): RequestHandler {
  const userTokenVerifier = new UserTokenVerifier(userTokenConfig);
  const googleTokenGenerator = new GoogleTokenGenerator(googleConfig);

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Phase 1: Firebase JWT verification
      if (userTokenConfig.skipVerification) {
        // Development/test mode - use mock user
        req.user = userTokenConfig.mockUser || {
          sub: 'dev-user',
          email: 'dev@example.com'
        };
      } else {
        // Production/staging mode - verify JWT
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new AuthenticationError('Authorization header required');
        }

        const token = authHeader.split(' ')[1];
        req.user = await userTokenVerifier.verify(token);
      }

      // Phase 2: Google service token injection
      if (googleConfig.skipAuth) {
        // Development mode - skip service token injection
      } else {
        const serviceToken = await googleTokenGenerator.generateIdToken(bffAudience);
        req.headers.authorization = `Bearer ${serviceToken}`;
        
        // Debug: log the token before it is attached to the outgoing request
        if (process.env.LOG_BFF_TOKEN === 'true') {
          console.log('[Auth → BFF] Outgoing Bearer token (pre-proxy):', serviceToken);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
} 