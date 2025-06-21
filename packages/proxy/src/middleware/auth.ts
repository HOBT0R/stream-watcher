import { NextFunction, Request, Response } from 'express';
import * as jose from 'jose';
import config from '../config.js';

/**
 * Extends the Express `Request` object to include an optional `user` property.
 * This allows us to attach the decoded JWT payload to the request object
 */

let jwksClient: ReturnType<typeof jose.createRemoteJWKSet> | undefined;

function getJwksClient() {
    if (!jwksClient) {
        if (!config.jwt.jwksUri) {
            throw new Error('JWKS URI not configured');
        }
        jwksClient = jose.createRemoteJWKSet(new URL(config.jwt.jwksUri));
    }
    return jwksClient;
}

export function clearJwksClient() {
    jwksClient = undefined;
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // If verification is disabled (local development), skip checks entirely
  if (config.jwt.skipVerification) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jose.jwtVerify(token, getJwksClient(), {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
    });

    req.user = { sub: payload.sub };
    next();
  } catch (error) {
    let errorMessage = 'JWT Verification Error';
    if (error instanceof Error) {
      errorMessage = `JWT Verification Error: ${error.message}`;
    }
    console.error(errorMessage, error);
    res.status(401).json({ error: errorMessage });
  }
}

export default verifyToken; 