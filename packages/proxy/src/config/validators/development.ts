import { ConfigValidator } from '../validation.js';
import { DevelopmentConfig } from '../schema.js';

export class DevelopmentValidator extends ConfigValidator {
  validate(env: NodeJS.ProcessEnv): DevelopmentConfig {
    this.reset();

    // Base configuration
    const port = this.validatePort(env.PORT, 'PORT', 8080);
    
    const bffTargetUrlStr = this.optional(env.BFF_TARGET_URL, 'http://localhost:3001', 'BFF_TARGET_URL');
    const bffTargetUrl = this.validateUrl(bffTargetUrlStr, 'BFF_TARGET_URL');
    
    const bffAudienceStr = this.optional(env.BFF_AUDIENCE, bffTargetUrl.toString(), 'BFF_AUDIENCE');
    // Validate it's a valid URL but store as string to preserve exact format
    this.validateUrl(bffAudienceStr, 'BFF_AUDIENCE');
    const bffAudience = bffAudienceStr;

    // User token configuration - flexible for development
    const skipUserTokenVerification = env.SKIP_JWT_VERIFY !== 'false';
    
    const userToken = {
      skipVerification: skipUserTokenVerification,
      publicKey: env.JWT_PUBLIC_KEY,
      mockUser: {
        sub: env.MOCK_USER_ID || 'dev-user-123',
        email: env.MOCK_USER_EMAIL || 'dev@example.com',
        name: env.MOCK_USER_NAME || 'Dev User'
      }
    };

    // Google configuration - always skip in development
    const google = {
      skipAuth: true as const,
      mockToken: env.GOOGLE_MOCK_TOKEN || 'mock-google-token'
    };

    // Logging configuration
    const logging = {
      level: env.LOG_LEVEL || 'debug',
      format: 'simple' as const,
      enableRequestLogging: env.ENABLE_REQUEST_LOGGING !== 'false',
      enableBffTokenLogging: env.LOG_BFF_TOKEN === 'true',
      enableRequestBodyLogging: env.LOG_REQUEST_BODY !== 'false',
      enableFileLogging: true
    };

    return {
      port,
      bffTargetUrl,
      bffAudience,
      userToken,
      google,
      logging
    };
  }
} 