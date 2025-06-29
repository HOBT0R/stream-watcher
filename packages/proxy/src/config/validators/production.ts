import { ConfigValidator } from '../validation.js';
import { ProductionConfig } from '../schema.js';
import { ConfigError } from '../errors.js';

export class ProductionValidator extends ConfigValidator {
  validate(env: NodeJS.ProcessEnv): ProductionConfig {
    this.reset();

    // Base configuration
    const port = this.validatePort(env.PORT, 'PORT', 8080);
    
    // BFF configuration - strict validation for production
    let bffTargetUrl: URL;
    let bffAudience: URL;
    
    // Handle APP_CONFIG_JSON (Cloud Run secrets) or individual env vars
    if (env.APP_CONFIG_JSON) {
      try {
        const secretConfig = JSON.parse(env.APP_CONFIG_JSON);
        if (!secretConfig.cloudRunUrl) {
          this.errors.push(new ConfigError(
            'APP_CONFIG_JSON.cloudRunUrl',
            undefined,
            'cloudRunUrl is required in APP_CONFIG_JSON'
          ));
          bffTargetUrl = new URL('http://invalid');
          bffAudience = new URL('http://invalid');
        } else {
          bffTargetUrl = this.validateUrl(secretConfig.cloudRunUrl, 'APP_CONFIG_JSON.cloudRunUrl');
          bffAudience = bffTargetUrl; // Same URL for both in production
        }
      } catch (_error) {
        this.errors.push(new ConfigError(
          'APP_CONFIG_JSON',
          env.APP_CONFIG_JSON,
          'must be valid JSON'
        ));
        bffTargetUrl = new URL('http://invalid');
        bffAudience = new URL('http://invalid');
      }
    } else {
      // Fallback to individual environment variables
      const bffTargetUrlStr = this.required(env.BFF_TARGET_URL, 'BFF_TARGET_URL');
      const bffAudienceStr = this.required(env.BFF_AUDIENCE, 'BFF_AUDIENCE');
      
      bffTargetUrl = this.validateUrl(bffTargetUrlStr, 'BFF_TARGET_URL');
      bffAudience = this.validateUrl(bffAudienceStr, 'BFF_AUDIENCE');
    }

    // User token configuration - strict validation for production
    const jwksUriStr = this.required(env.JWT_JWKS_URI, 'JWT_JWKS_URI');
    const issuer = this.required(env.JWT_ISSUER, 'JWT_ISSUER');
    const audience = this.required(env.JWT_AUDIENCE, 'JWT_AUDIENCE');
    
    const userToken = {
      skipVerification: false as const,
      jwksUri: this.validateUrl(jwksUriStr, 'JWT_JWKS_URI'),
      issuer,
      audience
    };

    // Google configuration - strict validation for production
    const projectId = this.required(env.GOOGLE_CLOUD_PROJECT, 'GOOGLE_CLOUD_PROJECT');
    const googleAudience = this.required(env.BFF_AUDIENCE, 'BFF_AUDIENCE');
    
    const google = {
      skipAuth: false as const,
      projectId,
      audience: googleAudience
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