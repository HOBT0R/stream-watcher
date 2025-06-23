import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dotenv import to prevent it from loading any .env files.
// This is crucial for creating isolated and deterministic tests.
vi.mock('dotenv/config', () => ({}));


describe('AppConfig', () => {
  // Define a baseline, valid environment for most test cases.
  // This reduces boilerplate in individual tests.
  const defaultTestEnv = {
    FIREBASE_PROJECT_ID: 'test-project-id',
    JWT_ISSUER: 'https://securetoken.google.com/test-project-id',
    JWT_AUDIENCE: 'test-project-id',
    JWT_JWKS_URI:
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  };

  // Before each test, we ensure a clean, isolated environment.
  beforeEach(() => {
    // 1. Reset `process.env` to the default test environment.
    // This provides a valid starting point for most tests.
    process.env = { ...defaultTestEnv };

    // 2. Invalidate the module cache.
    // The `config.ts` module is evaluated once on the first `import`.
    // To make it re-evaluate with our clean `process.env`, we must clear
    // Vitest's cache of the module.
    vi.resetModules();
  });

  it('should load default configuration when no environment variables are set', async () => {
    // For this specific test, we want a truly empty environment.
    process.env = {};
    // We must also skip JWT verification to avoid the projectId validation.
    process.env.SKIP_JWT_VERIFY = 'true';

    // Dynamically import the config now that the environment is set
    const { default: config } = await import('./config.js');

    expect(config.port).toBe(8080);
    expect(config.bffTargetUrl).toBe('http://localhost:3001');
    expect(config.bffAudience).toBe('http://localhost:3001');
    expect(config.jwt.skipVerification).toBe(true);
    expect(config.jwt.jwksUri).toBe(
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    );
    expect(config.jwt.issuer).toBe('');
    expect(config.jwt.audience).toBe('');
    expect(config.firebase.projectId).toBe('');
  });

  it('should throw an error if JWT verification is enabled but no projectId is provided', async () => {
    // Start with a completely empty environment for this test.
    process.env = {};
    // SKIP_JWT_VERIFY defaults to false, so no need to set it.
    await expect(import('./config.js')).rejects.toThrow(
      'Missing critical configuration. Ensure FIREBASE_PROJECT_ID is set.'
    );
  });

  it('should NOT throw an error if JWT verification is skipped, even with no projectId', async () => {
    // Start with a completely empty environment for this test.
    process.env = {};
    process.env.SKIP_JWT_VERIFY = 'true';
    await expect(import('./config.js')).resolves.toBeDefined();
  });

  it('should load configuration from individual environment variables', async () => {
    // These will overwrite the defaults set in beforeEach
    process.env.PORT = '9999';
    process.env.BFF_TARGET_URL = 'http://test.bff:1234';
    process.env.BFF_AUDIENCE = 'http://test.audience';
    process.env.SKIP_JWT_VERIFY = 'true';
    process.env.JWT_PUBLIC_KEY = 'test-public-key';
    process.env.JWT_JWKS_URI = 'http://test-jwks-uri';
    process.env.JWT_ISSUER = 'test-issuer';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.FIREBASE_PROJECT_ID = 'different-test-project-id';

    const { default: config } = await import('./config.js');

    expect(config.port).toBe(9999);
    expect(config.bffTargetUrl).toBe('http://test.bff:1234');
    expect(config.bffAudience).toBe('http://test.audience');
    expect(config.jwt.skipVerification).toBe(true);
    expect(config.jwt.publicKey).toBe('test-public-key');
    expect(config.jwt.jwksUri).toBe('http://test-jwks-uri');
    expect(config.jwt.issuer).toBe('test-issuer');
    expect(config.jwt.audience).toBe('test-audience');
    expect(config.firebase.projectId).toBe('different-test-project-id');
  });


  it('should use BFF_BASE_URL as a fallback for both target and audience', async () => {
    process.env.BFF_BASE_URL = 'http://base.url';
    process.env.BFF_AUDIENCE = '';

    const { default: config } = await import('./config.js');

    expect(config.bffTargetUrl).toBe('http://base.url');
    expect(config.bffAudience).toBe('http://base.url');
  });

  it('should load BFF config from APP_CONFIG_JSON when present', async () => {
    const secretConfig = {
      cloudRunUrl: 'https://prod.url',
      serviceApiKey: 'prod-api-key', // this key is ignored by the current config loader
    };
    process.env.APP_CONFIG_JSON = JSON.stringify(secretConfig);

    const { default: config } = await import('./config.js');

    // APP_CONFIG_JSON should override other env vars for bff urls
    expect(config.bffTargetUrl).toBe('https://prod.url');
    expect(config.bffAudience).toBe('https://prod.url');
  });

  it('should still load other env vars even when APP_CONFIG_JSON is present', async () => {
    const secretConfig = {
      cloudRunUrl: 'https://prod.url',
    };
    process.env.APP_CONFIG_JSON = JSON.stringify(secretConfig);
    process.env.PORT = '1234';
    process.env.FIREBASE_PROJECT_ID = 'test-project-id-from-env';

    const { default: config } = await import('./config.js');

    expect(config.bffAudience).toBe('https://prod.url');
    expect(config.port).toBe(1234);
    expect(config.firebase.projectId).toBe('test-project-id-from-env');
  });
});
