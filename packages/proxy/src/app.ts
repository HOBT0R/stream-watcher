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
    // Debug: log the audience we are about to use when requesting a token
    console.log('[Auth] Generating Google ID token with audience:', audience);
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

    // Middleware to add Google-signed ID token before the request is proxied
    app.use('/api', async (req, res, next) => {
        try {
            if (process.env.NODE_ENV === 'production') {
                const idToken = await getGoogleIdToken(config.bffAudience);
                // Debug: log the token before it is attached to the outgoing request
                if (process.env.LOG_BFF_TOKEN === 'true') {
                    console.log('[Auth → BFF] Outgoing Bearer token (pre-proxy):', idToken);
                }
                // Express/Node normalises header names to lowercase
                req.headers.authorization = `Bearer ${idToken}`;
            }
            next();
        } catch (error) {
            console.error('Failed to add authentication token to proxy request:', error);
            res.status(500).json({ error: 'Failed to authenticate with backend service.' });
        }
    });

    const proxyOptions = {
        target: config.bffTargetUrl,
        changeOrigin: true,
        // Do NOT set a static Origin header in production. Setting an Origin that
        // the BFF does not allow triggers a CORS 403. For local development we
        // still spoof the Origin so that the BFF treats the request as same-site.
        headers: process.env.NODE_ENV !== 'production' ? { origin: config.bffTargetUrl } : undefined,
        proxyTimeout: 10000,
        timeout: 10000,
        // Ensure BFF receives the original /api prefix that Express strips.
        pathRewrite: (path: string, _req: Request) => `/api${path}`,
        // Keep body fixing for non-GET requests (sync)
        onProxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage) => {
            // In production, ensure the Origin header is removed so the BFF
            // doesn't reject the call with "Invalid CORS request".
            if (process.env.NODE_ENV === 'production') {
                proxyReq.removeHeader('origin');
            }

            // Debug: log the token and final Origin header
            if (process.env.LOG_BFF_TOKEN === 'true') {
                const outboundAuth = proxyReq.getHeader('authorization');
                const outboundOrigin = proxyReq.getHeader('origin');
                console.log('[Proxy→BFF] Authorization header (post-proxy):', outboundAuth);
                console.log('[Proxy→BFF] Origin header (post-proxy):', outboundOrigin);
            }

            fixRequestBody(proxyReq, req);
        },
        onError: (err: Error, _req: Request, res: Response | http.ServerResponse) => {
            console.error('Proxy error:', err);
            if (!res.headersSent) {
                if ('status' in res) {
                    (res as Response).status(502).json({ error: 'Bad Gateway - Upstream Error' });
                } else {
                    (res as http.ServerResponse).writeHead(502, { 'Content-Type': 'application/json' });
                    (res as http.ServerResponse).end(JSON.stringify({ error: 'Bad Gateway - Upstream Error' }));
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

    console.log('[Config] targetUrl =', config.bffTargetUrl);
    console.log('[Config] audience =', config.bffAudience);

    return app;
} 