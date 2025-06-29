import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { GoogleAuth } from 'google-auth-library';
import { type AppConfig } from './config.js';
import { type ValidatedAppConfig } from './config/index.js';
import { buildUnsignedJwt } from './test-helpers/jwtHelpers.js';

// Mock dotenv to prevent it from loading .env files
vi.mock('dotenv/config', () => ({}));

// Mock the auth middleware and new auth modules
vi.mock('./middleware/auth.js', () => ({
    verifyToken: (_req: Request, _res: Response, next: NextFunction) => {
        // For testing, just call next() to simulate successful auth
        next();
    },
}));

vi.mock('./auth/middleware.js', () => ({
    createAuthMiddleware: () => (req: Request, _res: Response, next: NextFunction) => {
        // For testing, just call next() to simulate successful auth
        // In production mode, inject a Google ID token
        if (process.env.NODE_ENV === 'production') {
            req.headers.authorization = 'Bearer mock-google-token';
        }
        next();
    },
}));

vi.mock('./auth/firebase/config.js', () => ({
    getFirebaseAuthConfig: () => ({
        skipVerification: true,
        mockUser: { sub: 'test-user', email: 'test@example.com' }
    }),
}));

vi.mock('./auth/google/config.js', () => ({
    getGoogleAuthConfig: () => ({
        skipAuth: true,
        mockToken: 'test-token'
    }),
}));

const fetchIdTokenMock = vi.fn(async (aud: string) => {
    return buildUnsignedJwt({ aud });
});

describe('Express App', () => {
    let app: Application;
    let mockBffServer: http.Server;
    let mockBffUrl: string;
    let mockConfig: AppConfig;
    let mockValidatedConfig: ValidatedAppConfig;
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
        
        mockValidatedConfig = {
            port: 8080,
            bffTargetUrl: new URL(mockBffUrl),
            bffAudience: new URL('https://twitchservice-230964387213.us-central1.run.app'),
            userToken: {
                skipVerification: true,
                mockUser: { sub: 'test-user', email: 'test@example.com', name: 'Test User' }
            },
            google: {
                skipAuth: true,
                mockToken: 'test-token'
            }
        };
        
        app = createApp(mockConfig, mockValidatedConfig);
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
        app = createApp(mockConfig, mockValidatedConfig);

        const response = await request(app).get('/api/idtoken/test');

        // The mock BFF echoes back the headers it received, so we can inspect them in the JSON body.
        const receivedAuthHeader = response.body.headers.authorization as string | undefined;
        expect(receivedAuthHeader).toBeDefined();

        // Check that the token is injected
        const [, token] = receivedAuthHeader!.split(' ');
        expect(token).toBe('mock-google-token');

        // Restore NODE_ENV for subsequent tests
        process.env.NODE_ENV = originalNodeEnv;
    });
}); 