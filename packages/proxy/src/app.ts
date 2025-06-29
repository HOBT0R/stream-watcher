import express, { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import * as http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAuthMiddleware } from './auth/middleware.js';
import { type AppConfig } from './config.js';
import { type ValidatedAppConfig } from './config/index.js';
import { UserTokenVerificationError } from './auth/user-token-verifier/errors.js';
import { AuthenticationError } from './auth/types.js';
import morgan from 'morgan';
import cors from 'cors';

export function createApp(
    config: AppConfig,
    validatedConfig: ValidatedAppConfig
): Application {
    const app = express();

    // ================================
    // Constants & Configuration
    // ================================
    
    // Auth configurations from validated config
    const userTokenConfig = {
        skipVerification: validatedConfig.userToken.skipVerification,
        publicKey: validatedConfig.userToken.publicKey,
        jwksUri: validatedConfig.userToken.jwksUri?.toString(),
        issuer: validatedConfig.userToken.issuer,
        audience: validatedConfig.userToken.audience,
        mockUser: validatedConfig.userToken.mockUser
    };
    
    const googleConfig = {
        skipAuth: validatedConfig.google.skipAuth,
        projectId: validatedConfig.google.projectId,
        audience: validatedConfig.google.audience,
        mockToken: validatedConfig.google.mockToken
    };
    
    const authMiddleware = createAuthMiddleware(
        userTokenConfig,
        googleConfig,
        config.bffAudience
    );

    // Proxy configuration
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
        // http-proxy-middleware v3 uses the "on" option to hook into events
        // Keep body fixing for non-GET requests (sync)
        on: {
            proxyReq: (proxyReq: http.ClientRequest, req: http.IncomingMessage) => {
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

    // Static file serving paths
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uiDistPath = path.join(__dirname, '..', '..', '..', 'dist');

    // ================================
    // Middleware Registration
    // ================================

    // Global middleware
    app.use(cors());
    app.use(morgan('combined')); // Standard Apache combined log format
    
    // Health check endpoint
    app.get('/healthz', (_req: Request, res: Response) => {
        res.status(200).send('OK');
    });

    // Enhanced health check endpoint with configuration status
    app.get('/health', (_req: Request, res: Response) => {
        const configHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            config: {
                bffTarget: config.bffTargetUrl,
                authConfigured: !userTokenConfig.skipVerification,
                googleAuthConfigured: !googleConfig.skipAuth
            }
        };
        
        res.json(configHealth);
    });

    // API routes (auth + proxy)
    app.use('/api', authMiddleware);
    app.use('/api', createProxyMiddleware(proxyOptions));

    // Static file serving
    app.use(express.static(uiDistPath));

    // SPA fallback
    app.get('*', (_req, res) => {
        res.sendFile('index.html', { root: uiDistPath });
    });

    // ================================
    // Global Error Handler
    // ================================
    app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error('[Global Error Handler]', error.message, error);

        // Handle authentication errors
        if (error instanceof UserTokenVerificationError || error instanceof AuthenticationError) {
            const isExpired = (error as UserTokenVerificationError & { isExpired?: boolean }).isExpired === true;
            
            return res.status(401).json({
                error: {
                    type: error.name,
                    message: error.message,
                    code: isExpired ? 'TOKEN_EXPIRED' : 'AUTH_FAILED',
                    timestamp: new Date().toISOString(),
                    // Add a specific flag for expired tokens to trigger logout on frontend
                    requiresLogout: isExpired
                }
            });
        }

        // Handle other known errors
        if ('statusCode' in error && typeof error.statusCode === 'number') {
            return res.status(error.statusCode).json({
                error: {
                    type: error.name,
                    message: error.message,
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Fallback for unknown errors
        res.status(500).json({
            error: {
                type: 'InternalServerError',
                message: 'An unexpected error occurred',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString()
            }
        });
    });

    console.log('[Config] targetUrl =', config.bffTargetUrl);
    console.log('[Config] audience =', config.bffAudience);

    return app;
} 