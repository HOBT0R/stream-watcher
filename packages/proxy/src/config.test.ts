import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dotenv to prevent it from loading .env files
vi.mock('dotenv/config', () => ({}));

describe('Proxy Config', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules(); // Clear module cache
        process.env = { ...originalEnv }; // Restore original env
    });

    it('should throw an error if FIREBASE_PROJECT_ID is missing and JWT verification is enabled', async () => {
        process.env.SKIP_JWT_VERIFY = 'false';
        delete process.env.FIREBASE_PROJECT_ID;
        delete process.env.VITE_FIREBASE_PROJECT_ID; // Ensure all fallbacks are gone

        await expect(import('./config.js')).rejects.toThrow('Missing critical configuration. Ensure FIREBASE_PROJECT_ID is set.');
    });

    it('should load configuration from individual environment variables', async () => {
        process.env.PORT = '9000';
        process.env.BFF_BASE_URL = 'http://test-bff.com';
        process.env.BFF_API_KEY = 'test-api-key';
        process.env.JWT_JWKS_URI = 'http://test-jwks.com';
        process.env.JWT_ISSUER = 'test-issuer';
        process.env.JWT_AUDIENCE = 'test-audience';
        process.env.SKIP_JWT_VERIFY = 'true';

        const { default: config } = await import('./config.js');

        expect(config.port).toBe(9000);
        expect(config.bffBaseUrl).toBe('http://test-bff.com');
        expect(config.bffApiKey).toBe('test-api-key');
        expect(config.jwt.jwksUri).toBe('http://test-jwks.com');
        expect(config.jwt.issuer).toBe('test-issuer');
        expect(config.jwt.audience).toBe('test-audience');
        expect(config.jwt.skipVerification).toBe(true);
    });

    it('should load configuration from APP_CONFIG_JSON environment variable', async () => {
        const secretConfig = {
            cloudRunUrl: 'http://json-bff.com',
            serviceApiKey: 'json-api-key',
        };
        process.env.APP_CONFIG_JSON = JSON.stringify(secretConfig);
        process.env.FIREBASE_PROJECT_ID = 'test-project-id'; // Required to pass validation

        const { default: config } = await import('./config.js');

        // Check that the config is updated from the JSON
        expect(config.bffBaseUrl).toBe(secretConfig.cloudRunUrl);
        expect(config.bffApiKey).toBe(secretConfig.serviceApiKey);

        // Check that other values remain default
        expect(config.port).toBe(8080);
    });

    it('should use default values when no environment variables are set', async () => {
        // Set required values to pass validation, but leave others to default
        process.env.BFF_BASE_URL = 'http://mock-bff-url.com';
        process.env.BFF_API_KEY = 'default-api-key';
        process.env.SKIP_JWT_VERIFY = 'true';

        const { default: config } = await import('./config.js');

        expect(config.port).toBe(8080);
        expect(config.bffBaseUrl).toBe('http://mock-bff-url.com');
        expect(config.bffApiKey).toBe('default-api-key');
        expect(config.jwt.jwksUri).toBe('');
        expect(config.jwt.issuer).toBe('');
        expect(config.jwt.audience).toBe('');
        expect(config.jwt.skipVerification).toBe(true);
    });
}); 