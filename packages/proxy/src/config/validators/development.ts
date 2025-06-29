import { ConfigValidator } from '../validation.js';
import { DevelopmentConfig } from '../schema.js';

export class DevelopmentValidator extends ConfigValidator {
  validate(env: NodeJS.ProcessEnv): DevelopmentConfig {
    this.reset();

    // Base configuration
    const port = this.validatePort(env.PORT, 'PORT', 8080);
    
    // BFF configuration - allow fallbacks for development
    const bffTargetUrlStr = this.optional(
      env.BFF_TARGET_URL || env.BFF_BASE_URL,
      'http://localhost:3001',
      'BFF_TARGET_URL'
    );
    const bffTargetUrl = this.validateUrl(bffTargetUrlStr, 'BFF_TARGET_URL');
    
    const bffAudienceStr = this.optional(
      env.BFF_AUDIENCE || env.BFF_BASE_URL,
      'http://localhost:3001',
      'BFF_AUDIENCE'
    );
    const bffAudience = this.validateUrl(bffAudienceStr, 'BFF_AUDIENCE');

    // User token configuration - flexible for development
    const skipJwtVerification = this.validateBoolean(env.SKIP_JWT_VERIFY, 'SKIP_JWT_VERIFY', true);
    const userToken = {
      skipVerification: skipJwtVerification,
      publicKey: env.JWT_PUBLIC_KEY, // optional in dev
      mockUser: {
        sub: 'dev-user-123',
        email: 'developer@example.com',
        name: 'Development User'
      }
    };

    // Google configuration - always skip auth in development
    const google = {
      skipAuth: true as const,
      mockToken: 'dev-service-token'
    };

    return {
      port,
      bffTargetUrl,
      bffAudience,
      userToken,
      google
    };
  }
} 