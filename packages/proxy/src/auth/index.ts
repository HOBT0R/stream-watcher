// Google exports
export { getGoogleAuthConfig } from './google/config.js';
export { GoogleTokenGenerator } from './google/tokenGenerator.js';
export type { GoogleAuthConfig } from './google/types.js';
export { GoogleTokenGenerationError } from './google/errors.js';

// User Token exports
export { getUserTokenConfig } from './user-token-verifier/config.js';
export { UserTokenVerifier } from './user-token-verifier/verifier.js';
export type { UserTokenConfig, UserTokenPayload } from './user-token-verifier/types.js';
export { UserTokenAuthError, UserTokenVerificationError, UserTokenConfigurationError } from './user-token-verifier/errors.js';

// Middleware exports
export { createAuthMiddleware } from './middleware.js';
export type { AuthenticationError } from './types.js'; 