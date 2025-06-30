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
    let bffAudience: string; // Changed to string to preserve exact format
    
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
          bffAudience = 'http://invalid';
        } else {
          bffTargetUrl = this.validateUrl(secretConfig.cloudRunUrl, 'APP_CONFIG_JSON.cloudRunUrl');
          // Validate it's a valid URL but store as string to preserve exact format
          this.validateUrl(secretConfig.cloudRunUrl, 'APP_CONFIG_JSON.cloudRunUrl');
          bffAudience = secretConfig.cloudRunUrl;
        }
      } catch (_error) {
        this.errors.push(new ConfigError(
          'APP_CONFIG_JSON',
          env.APP_CONFIG_JSON,
          'must be valid JSON'
        ));
        bffTargetUrl = new URL('http://invalid');
        bffAudience = 'http://invalid';
      }
    } else {
      // Fallback to individual environment variables
      const bffTargetUrlStr = this.required(env.BFF_TARGET_URL, 'BFF_TARGET_URL');
      const bffAudienceStr = this.required(env.BFF_AUDIENCE, 'BFF_AUDIENCE');
      
      bffTargetUrl = this.validateUrl(bffTargetUrlStr, 'BFF_TARGET_URL');
      // Validate it's a valid URL but store as string to preserve exact format
      this.validateUrl(bffAudienceStr, 'BFF_AUDIENCE');
      bffAudience = bffAudienceStr;
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
    // Use the already parsed bffAudience (works for both APP_CONFIG_JSON and env vars)
    const googleAudience = bffAudience;
    
    const google = {
      skipAuth: false as const,
      projectId,
      audience: googleAudience
    };

    // Logging configuration - production defaults
    const logging = {
      level: env.LOG_LEVEL || 'info',
      format: 'json' as const,
      enableRequestLogging: env.ENABLE_REQUEST_LOGGING !== 'false',
      enableBffTokenLogging: env.LOG_BFF_TOKEN === 'true',
      enableRequestBodyLogging: env.LOG_REQUEST_BODY === 'true',
      enableFileLogging: false
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