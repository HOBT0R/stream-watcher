import { JWTPayload } from 'jose';

export interface UserTokenPayload extends JWTPayload {
  sub: string;
  email?: string;
  name?: string;
}

export interface UserTokenConfig {
  skipVerification: boolean;
  publicKey?: string;
  jwksUri?: string;
  issuer?: string;
  audience?: string;
  mockUser?: {
    sub: string;
    email: string;
    name?: string;
  };
} 