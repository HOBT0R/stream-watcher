import { createValidator } from './validators/index.js';
import { ValidatedAppConfig } from './schema.js';
import { AppConfig } from '../config.js';
import { ConfigError, ConfigWarning } from './errors.js';

// Cache the validated configuration to avoid running validation multiple times
let _validatedConfig: ValidatedAppConfig | null = null;

export function getValidatedConfig(): ValidatedAppConfig {
  if (_validatedConfig) {
    return _validatedConfig;
  }

  const environment = process.env.NODE_ENV || 'development';
  const validator = createValidator(environment);
  const result = validator.validate(process.env);

  if (!result.isValid) {
    console.error('❌ Configuration validation failed:');
    result.errors.forEach((error: ConfigError) => console.error(`  • ${error.message}`));
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    result.warnings.forEach((warning: ConfigWarning) => 
      console.warn(`  • ${warning.field}: ${warning.message}`)
    );
  }

  console.log('✅ Configuration validated successfully');
  _validatedConfig = validator.getConfig();
  return _validatedConfig;
}

// Backward compatibility: Convert validated config back to current AppConfig format
export function getValidatedConfigAsLegacy(): AppConfig {
  const validated = getValidatedConfig();
  
  return {
    port: validated.port,
    bffTargetUrl: validated.bffTargetUrl.toString(),
    bffAudience: validated.bffAudience.toString(),
    jwt: {
      skipVerification: validated.userToken.skipVerification,
      publicKey: validated.userToken.publicKey || '',
      jwksUri: validated.userToken.jwksUri?.toString() || '',
      issuer: validated.userToken.issuer || '',
      audience: validated.userToken.audience || ''
    },
    firebase: {
      projectId: validated.google.projectId || ''
    }
  };
}

export * from './schema.js';
export * from './errors.js';
export * from './validation.js'; 