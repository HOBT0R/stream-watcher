import { SignJWT } from 'jose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function generateToken() {
    try {
        const privateKeyPath = path.resolve(__dirname, '../dev_private.pem');
        const privateKeyPem = await fs.readFile(privateKeyPath, 'utf-8');
        
        const { importPKCS8 } = await import('jose');
        const privateKey = await importPKCS8(privateKeyPem, 'RS256');

        const issuer = process.env.JWT_ISSUER;
        const audience = process.env.JWT_AUDIENCE;

        if (!issuer || !audience) {
            throw new Error('JWT_ISSUER and JWT_AUDIENCE must be set in your .env file.');
        }

        const jwt = await new SignJWT({ sub: 'local-dev-user', roles: ['admin', 'viewer'] })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuer(issuer)
            .setAudience(audience)
            .setExpirationTime('2h')
            .setIssuedAt()
            .sign(privateKey);

        console.log(jwt);

    } catch (error) {
        console.error('Error generating token:', error);
        process.exit(1);
    }
}

generateToken(); 