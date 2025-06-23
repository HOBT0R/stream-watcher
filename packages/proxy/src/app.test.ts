import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { GoogleAuth } from 'google-auth-library';
import { type AppConfig } from './config.js';
import { buildUnsignedJwt, decodeJwt } from './test-helpers/jwtHelpers.js';

// Mock dotenv to prevent it from loading .env files
vi.mock('dotenv/config', () => ({}));

// Mock the auth middleware
vi.mock('./middleware/auth.js', () => ({
    verifyToken: (_req: Request, _res: Response, next: NextFunction) => {
        // For testing, just call next() to simulate successful auth
        next();
    },
}));

const fetchIdTokenMock = vi.fn(async (aud: string) => {
    return buildUnsignedJwt({ aud });
});

describe('Express App', () => {
    let app: Application;
    let mockBffServer: http.Server;
    let mockBffUrl: string;
    let mockConfig: AppConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let createApp: any;

    beforeAll(() => {
        return new Promise<void>((resolve) => {
            const mockBff = http.createServer((req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify({
                        url: req.url,
                        headers: req.headers,
                        method: req.method,
                    })
                );
            });
            mockBffServer = mockBff.listen(0, () => {
                const address = mockBffServer.address();
                if (typeof address === 'string') {
                    mockBffUrl = address;
                } else if (address) {
                    mockBffUrl = `http://localhost:${address.port}`;
                }
                resolve();
            });
        });
    });

    // Isolate module imports for each test to handle module-level state in app.ts
    beforeEach(async () => {
        vi.resetModules();

        // Spy on the prototype *before* the module is imported
        vi.spyOn(GoogleAuth.prototype, 'getIdTokenClient').mockResolvedValue({
            idTokenProvider: {
                fetchIdToken: fetchIdTokenMock,
            },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        // Dynamically import the app module AFTER spying
        const appModule = await import('./app.js');
        createApp = appModule.createApp;

        mockConfig = {
            port: 8080,
            bffTargetUrl: mockBffUrl,
            bffAudience: 'https://twitchservice-230964387213.us-central1.run.app',
            jwt: {
                jwksUri: '',
                issuer: '',
                audience: '',
            },
            firebase: {
                projectId: '',
            },
        };
        app = createApp(mockConfig);
    });

    afterAll(() => {
        return new Promise((resolve) => {
            mockBffServer.close(() => resolve());
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        fetchIdTokenMock.mockClear();
    });

    it('GET /healthz should return 200 OK', async () => {
        const response = await request(app).get('/healthz');
        expect(response.status).toBe(200);
        expect(response.text).toBe('OK');
    });

    it('GET /.well-known/jwks.json should return default JWKS', async () => {
        const response = await request(app).get('/.well-known/jwks.json');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('keys');
        expect(response.body.keys[0].kid).toBe('test-kid');
    });

    it('GET /.well-known/jwks.json should return a custom JWKS response if provided', async () => {
        const customJwks = { keys: [{ kid: 'custom-kid' }] };
        const customApp = createApp(mockConfig, customJwks);
        const response = await request(customApp).get('/.well-known/jwks.json');
        expect(response.status).toBe(200);
        expect(response.body.keys[0].kid).toBe('custom-kid');
    });

    it('should proxy GET requests to /api/some/path and rewrite the path', async () => {
        const response = await request(app).get('/api/some/path');
        expect(response.status).toBe(200);
        expect(response.body.url).toBe('/api/some/path');
        expect(response.body.method).toBe('GET');
    });

    it('should proxy POST requests with a body', async () => {
        const postData = { message: 'hello' };
        const response = await request(app)
            .post('/api/submit')
            .send(postData);
        
        expect(response.status).toBe(200);
        expect(response.body.method).toBe('POST');
        expect(response.body.url).toBe('/api/submit');
    });

    it('should include an ID token in the Authorization header derived from google-auth-library for the BFF_BASE_URL', async () => {
        // Force production mode so the proxy attempts to fetch an ID token
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        // Re-create the app **after** setting NODE_ENV to production to pick up the change
        app = createApp(mockConfig);

        const response = await request(app).get('/api/idtoken/test');

        // The mock BFF echoes back the headers it received, so we can inspect them in the JSON body.
        const receivedAuthHeader = response.body.headers.authorization as string | undefined;
        expect(receivedAuthHeader).toBeDefined();

        // Decode the token and check its `aud` claim
        const [, token] = receivedAuthHeader!.split(' ');
        const decodedToken = decodeJwt(token);
        expect(decodedToken.aud).toBe(mockConfig.bffAudience);

        // Assert our fetchIdToken was called exactly once with the expected audience
        expect(fetchIdTokenMock).toHaveBeenCalledTimes(1);
        expect(fetchIdTokenMock).toHaveBeenCalledWith(mockConfig.bffAudience);

        // Restore NODE_ENV for subsequent tests
        process.env.NODE_ENV = originalNodeEnv;
    });
}); 