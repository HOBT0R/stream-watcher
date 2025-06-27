export class GoogleAuthError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

export class GoogleTokenGenerationError extends GoogleAuthError {
  constructor(message: string, public originalError?: Error) {
    super(`Google Token Generation Error: ${message}`, 500);
    this.name = 'GoogleTokenGenerationError';
  }
}

export class GoogleConfigurationError extends GoogleAuthError {
  constructor(message: string) {
    super(`Google Configuration Error: ${message}`, 500);
    this.name = 'GoogleConfigurationError';
  }
} 