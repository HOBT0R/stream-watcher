export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  name?: string;
} 