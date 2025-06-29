export class ConfigError extends Error {
  constructor(
    public field: string,
    public value: string | undefined,
    public reason: string
  ) {
    super(`Configuration error in ${field}: ${reason}`);
    this.name = 'ConfigError';
  }
}

export class ConfigWarning {
  constructor(
    public field: string,
    public message: string
  ) {}
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigError[];
  warnings: ConfigWarning[];
} 