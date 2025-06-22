import express, { Application, Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import * as http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from './middleware/auth.js';
import { type AppConfig } from './config.js';
import morgan from 'morgan';
import cors from 'cors';
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth();
let idTokenClient: any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function getGoogleIdToken(audience: string): Promise<string> {
    if (!idTokenClient) {
        idTokenClient = await auth.getIdTokenClient(audience);
    }
    const idToken = await idTokenClient.idTokenProvider.fetchIdToken(audience);
    return idToken;
}

export function createApp(
    config: AppConfig,
    jwksResponse?: Record<string, unknown>
): Application {
    const app = express();

    app.use(cors());
    app.use(morgan('dev'));
    // Apply JSON body parsing *only* to non-proxied routes so the raw body
    // remains intact for /api requests that are forwarded to the BFF.
    // Anything registered after the proxy can still use req.body.

    app.get('/healthz', (_req: Request, res: Response) => {
        res.status(200).send('OK');
    });

    // JWKS endpoint for testing
    app.get('/.well-known/jwks.json', (_req: Request, res: Response) => {
        const defaultJwks = {
            keys: [
                {
                    kty: 'RSA',
                    use: 'sig',
                    kid: 'test-kid',
                    alg: 'RS256',
                    n: 'mock-n-value',
                    e: 'AQAB'
                }
            ]
        };
        res.json(jwksResponse || defaultJwks);
    });

    app.use('/api', verifyToken);

    const proxyOptions = {
        target: config.bffBaseUrl,
        changeOrigin: true,
        headers: {
            origin: config.bffBaseUrl,
        },
        proxyTimeout: 10000,
        timeout: 10000,
        // Ensure BFF receives the original /api prefix that Express strips.
        // If the incoming request is /api/v1/statuses, Express forwards
        // "/v1/statuses" to the proxy. We prepend the prefix back so the
        // upstream sees "/api/v1/statuses" as expected.
        pathRewrite: (path: string, _req: Request) => `/api${path}`,
        onProxyReq: async (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse) => {
            try {
                if (process.env.NODE_ENV === 'production') {
                    const idToken = await getGoogleIdToken(config.bffBaseUrl);
                    proxyReq.setHeader('Authorization', `Bearer ${idToken}`);
                }
            } catch (error) {
                console.error('Failed to add authentication token to proxy request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to authenticate with backend service.' }));
                proxyReq.destroy();
            }
            fixRequestBody(proxyReq, req);
        },
        onProxyRes: (_proxyRes: http.IncomingMessage, _req: Request, _res: Response) => {},
        onError: (err: Error, _req: Request, res: Response | http.ServerResponse) => {
            console.error('Proxy error:', err);
            if (!res.headersSent) {
                if ('status' in res) {
                    // This is an Express Response object
                    res.status(502).json({ error: 'Bad Gateway - Upstream Error' });
                } else {
                    // This is an http.ServerResponse object
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(
                        JSON.stringify({ error: 'Bad Gateway - Upstream Error' })
                    );
                }
            }
        },
    };

    app.use('/api', createProxyMiddleware(proxyOptions));

    // JSON parsing for all subsequent routes (non-proxied)
    app.use(express.json());

    // Serve the pre-built React UI once API routes are registered
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uiDistPath = path.join(__dirname, '..', '..', '..', 'dist');

    app.use(express.static(uiDistPath));

    // SPA fallback
    app.get('*', (_req, res) => {
        res.sendFile('index.html', { root: uiDistPath });
    });

    console.log('[Config] target =', config.bffBaseUrl);

    return app;
} 