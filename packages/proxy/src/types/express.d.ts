// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express';
import { JWTPayload } from 'jose';
import winston from 'winston';

declare global {
  namespace Express {
    export interface Request {
      user?: JWTPayload;
      correlationId?: string;
      logger?: winston.Logger;
    }
  }
} 