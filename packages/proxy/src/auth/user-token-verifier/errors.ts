export class UserTokenAuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'UserTokenAuthError';
  }
}

export class UserTokenVerificationError extends UserTokenAuthError {
  constructor(message: string, public originalError?: Error) {
    super(`User Token Verification Error: ${message}`, 401);
    this.name = 'UserTokenVerificationError';
  }
}

export class UserTokenConfigurationError extends UserTokenAuthError {
  constructor(message: string) {
    super(`User Token Configuration Error: ${message}`, 500);
    this.name = 'UserTokenConfigurationError';
  }
} 