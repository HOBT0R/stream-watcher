import { ValidatedAppConfig } from '../schema.js';
import { ConfigValidationResult } from '../errors.js';
import { DevelopmentValidator } from './development.js';
import { ProductionValidator } from './production.js';

export interface ValidatingConfig {
  validate(env: NodeJS.ProcessEnv): ConfigValidationResult;
  getConfig(): ValidatedAppConfig;
}

export function createValidator(environment: string): ValidatingConfig {
  switch (environment) {
    case 'production':
    case 'staging':
      return new ProductionValidatorWithConfig();
      
    case 'development':
    case 'test':
    default:
      return new DevelopmentValidatorWithConfig();
  }
}

class DevelopmentValidatorWithConfig implements ValidatingConfig {
  private validator = new DevelopmentValidator();
  private config?: ValidatedAppConfig;

  validate(env: NodeJS.ProcessEnv): ConfigValidationResult {
    const result = this.validator.validate(env);
    this.config = {
      ...result,
      userToken: {
        ...result.userToken,
        jwksUri: result.userToken.publicKey ? undefined : new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
        issuer: result.userToken.publicKey ? undefined : '',
        audience: result.userToken.publicKey ? undefined : ''
      },
      google: {
        ...result.google,
        projectId: undefined,
        audience: undefined
      }
    };
    return this.validator.getResult();
  }

  getConfig(): ValidatedAppConfig {
    if (!this.config) {
      throw new Error('Must call validate() before getConfig()');
    }
    return this.config;
  }
}

class ProductionValidatorWithConfig implements ValidatingConfig {
  private validator = new ProductionValidator();
  private config?: ValidatedAppConfig;

  validate(env: NodeJS.ProcessEnv): ConfigValidationResult {
    const result = this.validator.validate(env);
    this.config = {
      ...result,
      userToken: {
        ...result.userToken,
        publicKey: undefined,
        mockUser: undefined
      },
      google: {
        ...result.google,
        mockToken: undefined
      }
    };
    return this.validator.getResult();
  }

  getConfig(): ValidatedAppConfig {
    if (!this.config) {
      throw new Error('Must call validate() before getConfig()');
    }
    return this.config;
  }
}

export { DevelopmentValidator, ProductionValidator }; 