import { JWTPayload } from 'jose';

// Polyfill for Buffer for browser/edge environments if needed
const Buffer = globalThis.Buffer || (await import('buffer')).Buffer;

/** Build a minimal, unsecured JWT by hand */
export function buildUnsignedJwt(payload: JWTPayload): string {
  const header = { alg: 'none' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  // Unsecured JWTs have an empty signature part
  return `${encodedHeader}.${encodedPayload}.`;
}

/** Quick helper to pull the payload back out by decoding it manually */
export function decodeJwt(token: string): JWTPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
    }
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
} 