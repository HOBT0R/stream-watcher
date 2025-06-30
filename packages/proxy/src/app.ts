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
import { createLogger } from './utils/logger.js';
import { createCorrelationMiddleware } from './middleware/correlation.js';
import { createRequestLoggingMiddleware, createRequestDetailsMiddleware } from './middleware/requestLogging.js';

export function createApp(
    config: AppConfig,
    validatedConfig: ValidatedAppConfig
): Application {
    const app = express();

    // ================================
    // Logging Setup
    // ================================
    
    const logger = createLogger(validatedConfig.logging);
    const correlationMiddleware = createCorrelationMiddleware(logger);

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
        config.bffAudience,
        logger
    );

    // Proxy configuration with logging
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

                // Structured logging for BFF token (if enabled)
                if (validatedConfig.logging.enableBffTokenLogging) {
                    const outboundAuth = proxyReq.getHeader('authorization');
                    const outboundOrigin = proxyReq.getHeader('origin');
                    const requestLogger = (req as Request).logger || logger;
                    
                    requestLogger.debug('BFF request details', {
                        event: 'proxy_bff_request',
                        authorization: outboundAuth,
                        origin: outboundOrigin,
                        target: config.bffTargetUrl,
                        correlationId: (req as Request).correlationId
                    });
                }

                fixRequestBody(proxyReq, req);
            },
        },
        onError: (err: Error, req: Request, res: Response | http.ServerResponse) => {
            const requestLogger = req.logger || logger;
            
            requestLogger.error('Proxy error occurred', {
                event: 'proxy_error',
                error: {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                },
                target: config.bffTargetUrl,
                correlationId: req.correlationId
            });
            
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
    
    // Correlation middleware (adds logger to request)
    app.use(correlationMiddleware);
    
    // Body parsing middleware (required for request body logging)
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request details logging middleware (if enabled)
    if (validatedConfig.logging.enableRequestLogging) {
        app.use(createRequestDetailsMiddleware(logger, true));
    }
    
    // Request body logging middleware (if enabled)
    if (validatedConfig.logging.enableRequestBodyLogging) {
        app.use(createRequestLoggingMiddleware(logger, true));
    }
    
    // Request logging middleware (only if enabled)
    if (validatedConfig.logging.enableRequestLogging) {
        // Custom morgan token for correlation ID
        morgan.token('correlationId', (req: Request) => req.correlationId || '-');
        
        // Custom morgan format that includes correlation ID
        const morganFormat = validatedConfig.logging.format === 'json' 
            ? ':method :url :status :response-time ms - :correlationId'
            : 'combined';
            
        app.use(morgan(morganFormat, {
            stream: {
                write: (message: string) => {
                    logger.info(message.trim(), { 
                        event: 'http_request',
                        service: 'proxy'
                    });
                }
            }
        }));
    }
    
    // Health check endpoint
    app.get('/healthz', (req: Request, res: Response) => {
        req.logger?.debug('Health check requested', {
            event: 'healthz_check',
            correlationId: req.correlationId
        });
        res.status(200).send('OK');
    });

    // Enhanced health check endpoint with configuration status
    app.get('/health', (req: Request, res: Response) => {
        const configHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            config: {
                bffTarget: config.bffTargetUrl,
                authConfigured: !userTokenConfig.skipVerification,
                googleAuthConfigured: !googleConfig.skipAuth,
                loggingLevel: validatedConfig.logging.level,
                loggingFormat: validatedConfig.logging.format
            }
        };
        
        req.logger?.info('Detailed health check requested', {
            event: 'health_check',
            configHealth,
            correlationId: req.correlationId
        });
        
        res.json(configHealth);
    });

    // API routes (auth + proxy)
    app.use('/api', authMiddleware);
    app.use('/api', createProxyMiddleware(proxyOptions));

    // Static file serving
    app.use(express.static(uiDistPath));

    // SPA fallback
    app.get('*', (req, res) => {
        req.logger?.debug('SPA fallback serving index.html', {
            event: 'spa_fallback',
            requestedPath: req.path,
            correlationId: req.correlationId
        });
        res.sendFile('index.html', { root: uiDistPath });
    });

    // ================================
    // Global Error Handler
    // ================================
    app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
        const requestLogger = req.logger || logger;
        
        requestLogger.error('Global error handler triggered', {
            event: 'global_error',
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            correlationId: req.correlationId,
            requestPath: req.path,
            requestMethod: req.method
        });

        // Handle authentication errors
        if (error instanceof UserTokenVerificationError || error instanceof AuthenticationError) {
            const isExpired = (error as UserTokenVerificationError & { isExpired?: boolean }).isExpired === true;
            
            requestLogger.warn('Authentication error occurred', {
                event: 'auth_error',
                errorType: error.name,
                isExpired,
                correlationId: req.correlationId
            });
            
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

    // Log application startup configuration
    logger.info('Proxy application configured', {
        event: 'app_startup',
        config: {
            targetUrl: config.bffTargetUrl,
            audience: config.bffAudience,
            authSkipped: userTokenConfig.skipVerification,
            googleAuthSkipped: googleConfig.skipAuth,
            loggingLevel: validatedConfig.logging.level,
            environment: process.env.NODE_ENV || 'development'
        }
    });

    return app;
} 