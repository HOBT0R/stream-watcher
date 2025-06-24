import { NextFunction, Request, Response } from 'express';
import * as jose from 'jose';
import config from '../config.js';
import fs from 'fs/promises';

/**
 * Extends the Express `Request` object to include an optional `user` property.
 * This allows us to attach the decoded JWT payload to the request object
 */

let jwksClient: ReturnType<typeof jose.createRemoteJWKSet> | undefined;
let cachedPublicKey: jose.KeyLike | undefined;

async function getVerificationKey(): Promise<jose.KeyLike | ReturnType<typeof jose.createRemoteJWKSet>> {
    // Prefer static public key if provided
    if (config.jwt.publicKey) {
        if (!cachedPublicKey) {
            let pem = config.jwt.publicKey;
            // If value starts with file:// treat as path
            if (pem.startsWith('file://')) {
                const path = pem.replace('file://', '');
                pem = await fs.readFile(path, 'utf-8');
            }
            cachedPublicKey = await jose.importSPKI(pem, 'RS256');
        }
        return cachedPublicKey;
    }

    // Otherwise fallback to remote JWKS
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
    cachedPublicKey = undefined;
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

  // DEBUG — remove after test
  try {
    const payload = jose.decodeJwt(token);
    const protectedHeader = jose.decodeProtectedHeader(token);
    console.log('[JWT] header:', protectedHeader);
    console.log('[JWT] payload:', payload);
    console.log('[JWT] cfg:', config.jwt);
  } catch (e) {
    console.warn('[JWT] Could not decode token for logging, this may be expected for malformed tokens.');
  }

  try {
    const key = await getVerificationKey();
    const { payload } = await jose.jwtVerify(
        token,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        key as any,
        {
            issuer: config.jwt.issuer,
            audience: config.jwt.audience,
        },
    );

    req.user = { sub: payload.sub };
    next();
  } catch (error) {
    let errorMessage = 'JWT Verification Error';
    if (error instanceof Error) {
      errorMessage = `JWT Verification Error: ${error.message}`;
    }
    console.error('[JWT-ERR]', errorMessage, error);
    res.status(401).json({ error: errorMessage });
  }
}

export default verifyToken; 