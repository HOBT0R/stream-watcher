import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';
import { createApp } from './app.js';
import http from 'http';
import { AppConfig } from './config.js';

// Mock dotenv to prevent it from loading .env files
vi.mock('dotenv/config', () => ({}));

// Mock the auth middleware
vi.mock('./middleware/auth.js', () => ({
    verifyToken: (req: Request, res: Response, next: NextFunction) => {
        // For testing, just call next() to simulate successful auth
        next();
    },
}));

describe('Express App', () => {
    let app: Application;
    let mockBffServer: http.Server;
    let mockBffUrl: string;
    let mockConfig: AppConfig;

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

    // Create a fresh app instance with a mock config for each test
    beforeEach(() => {
        mockConfig = {
            port: 8080,
            bffBaseUrl: mockBffUrl,
            bffApiKey: 'test-service-key',
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
}); 