import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServerResponse } from 'http';

export function createApp(bffUrl: string) {
    const app = express();

    app.get('/healthz', (req: Request, res: Response) => {
        res.status(200).json({ ok: true });
    });

    const proxyOptions = {
        target: bffUrl,
        changeOrigin: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq: any, req: Request, res: Response) => {
            // You can add custom logic here, like adding headers
        },
        onError: (err: Error, req: Request, res: Response | ServerResponse) => {
            console.error('Proxy error:', err);
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Bad Gateway - Upstream Error' }));
            }
        }
    };

    app.use('/api', createProxyMiddleware(proxyOptions));

    return app;
} 