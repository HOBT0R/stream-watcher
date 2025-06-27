import { UserTokenConfig } from './types.js';

export function getUserTokenConfig(): UserTokenConfig {
  const environment = process.env.NODE_ENV || 'development';
  
  // Environment-specific user token configuration
  switch (environment) {
    case 'production':
    case 'staging':
      return {
        skipVerification: false,
        publicKey: process.env.JWT_PUBLIC_KEY || '',
        jwksUri: process.env.JWT_JWKS_URI || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
        issuer: process.env.JWT_ISSUER || '',
        audience: process.env.JWT_AUDIENCE || ''
      };
      
    case 'development':
    case 'test':
    default:
      return {
        skipVerification: process.env.SKIP_JWT_VERIFY === 'true',
        publicKey: process.env.JWT_PUBLIC_KEY || '',
        jwksUri: process.env.JWT_JWKS_URI || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
        issuer: process.env.JWT_ISSUER || '',
        audience: process.env.JWT_AUDIENCE || '',
        mockUser: {
          sub: 'dev-user-123',
          email: 'developer@example.com',
          name: 'Development User'
        }
      };
  }
} 