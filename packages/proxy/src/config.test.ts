import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AppConfig } from './config.js';

// Prevent dotenv from loading files during tests
vi.mock('dotenv/config', () => ({}));

/**
 * Utility: load the configuration fresh each time after clearing Node's module cache.
 */
const loadConfig = async (): Promise<AppConfig> => {
    const { default: config } = await import('./config.js');
    return config as AppConfig;
};

/**
 * Utility: Apply a clean baseline environment and then any test-specific overrides.
 */
const setEnv = (overrides: Record<string, string | undefined> = {}): void => {
  Object.assign(process.env, {
    // baseline defaults (match real-world local dev)
    PORT: '8080',
    // Deliberately leave BFF_BASE_URL unset so tests can check fallback logic
    SKIP_JWT_VERIFY: 'false',
    FIREBASE_PROJECT_ID: 'stream-watcher',
    // allow tests to override
    ...overrides,
  });
};

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env *and* module cache before every test
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv; // restore
  });

  it('loads defaults when no env vars are provided', async () => {
    // Provide an empty env except for required baseline
    setEnv({ PORT: undefined, FIREBASE_PROJECT_ID: undefined, SKIP_JWT_VERIFY: 'true' });

    const cfg = await loadConfig();
    expect(cfg.port).toBe(8080);
    expect(cfg.bffBaseUrl).toBe('http://localhost:3001');
    expect(cfg.jwt.skipVerification).toBe(true);
  });

  it('prefers APP_CONFIG_JSON over individual env vars', async () => {
    setEnv();
    const secret = { cloudRunUrl: 'https://cloud.run/url' };
    process.env.APP_CONFIG_JSON = JSON.stringify(secret);

    const cfg = await loadConfig();
    expect(cfg.bffBaseUrl).toBe(secret.cloudRunUrl);
  });

  it('falls back to BFF_BASE_URL when APP_CONFIG_JSON is absent', async () => {
    setEnv({ BFF_BASE_URL: 'http://custom-bff:3001' });

    const cfg = await loadConfig();
    expect(cfg.bffBaseUrl).toBe('http://custom-bff:3001');
  });

  it('throws if Firebase project ID is missing and verification is enabled', async () => {
    setEnv({
      SKIP_JWT_VERIFY: 'false',
      FIREBASE_PROJECT_ID: undefined,
      VITE_FIREBASE_PROJECT_ID: undefined,
    });

    await expect(loadConfig()).rejects.toThrow(
      'Missing critical configuration. Ensure FIREBASE_PROJECT_ID is set.'
    );
  });
});
