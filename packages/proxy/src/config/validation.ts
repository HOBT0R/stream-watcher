import { ConfigError, ConfigWarning, ConfigValidationResult } from './errors.js';

export class ConfigValidator {
  protected errors: ConfigError[] = [];
  protected warnings: ConfigWarning[] = [];

  required(value: string | undefined, field: string): string {
    if (!value || value.trim() === '') {
      this.errors.push(new ConfigError(field, value, 'is required'));
      return '';
    }
    return value.trim();
  }

  optional(value: string | undefined, defaultValue: string, field: string): string {
    if (!value || value.trim() === '') {
      this.warnings.push(new ConfigWarning(field, `using default: ${defaultValue}`));
      return defaultValue;
    }
    return value.trim();
  }

  validateUrl(value: string, field: string): URL {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        this.errors.push(new ConfigError(field, value, 'must use http or https protocol'));
      }
      return url;
    } catch (_error) {
      this.errors.push(new ConfigError(field, value, 'is not a valid URL'));
      return new URL('http://invalid');
    }
  }

  validatePort(value: string | undefined, field: string, defaultPort: number = 8080): number {
    const port = parseInt(value || defaultPort.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      this.errors.push(new ConfigError(field, value, 'must be a valid port number (1-65535)'));
      return defaultPort;
    }
    return port;
  }

  validateBoolean(value: string | undefined, field: string, defaultValue: boolean = false): boolean {
    if (!value) {
      return defaultValue;
    }
    
    const normalized = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
    
    this.warnings.push(new ConfigWarning(field, `invalid boolean value "${value}", using default: ${defaultValue}`));
    return defaultValue;
  }

  getResult(): ConfigValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  reset(): void {
    this.errors = [];
    this.warnings = [];
  }
} 