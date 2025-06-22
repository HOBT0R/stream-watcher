/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
// Local Node proxy port; defaults to 8080 but can be overridden in the shell
const LOCAL_PROXY_PORT = process.env.PROXY_PORT || 8080;
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    resolve: {
        alias: [
            {
                find: '@',
                replacement: path.resolve(__dirname, 'src'),
            },
        ],
    },
    server: {
        host: true, // listen on all addresses during dev
        proxy: {
            '/api': {
                target: `http://localhost:${LOCAL_PROXY_PORT}`,
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        // Remove Origin header so that the backend sees the request as same-origin
                        proxyReq.removeHeader('origin');
                    });
                },
            },
        },
    },
    preview: {
        host: true, // listen on all addresses when running vite preview
        // Explicitly allow the server hostname so Vite doesn't block it.
        allowedHosts: true,
        proxy: {
            '/api': {
                target: `http://localhost:${LOCAL_PROXY_PORT}`,
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        proxyReq.removeHeader('origin');
                    });
                },
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['packages/**'],
        coverage: {
            reporter: ['text', 'html', 'lcov'],
        },
    },
});
