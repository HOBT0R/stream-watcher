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
    build: {
        // Optimize bundle size and loading performance
        rollupOptions: {
            output: {
                // Manual chunk splitting for better caching
                manualChunks: {
                    // React ecosystem
                    'react-vendor': ['react', 'react-dom'],
                    
                    // Firebase
                    'firebase-vendor': ['firebase/app', 'firebase/auth'],
                    
                    // UI libraries  
                    'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
                    
                    // Testing libraries (only in dev)
                    ...(process.env.NODE_ENV === 'development' && {
                        'test-vendor': ['@testing-library/react', '@testing-library/jest-dom', 'vitest']
                    }),
                },
                // Better file naming for caching
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },
        // Increase chunk size warning limit (we're splitting chunks now)
        chunkSizeWarningLimit: 1000,
        
        // Enable source maps for production debugging (optional)
        sourcemap: process.env.NODE_ENV === 'development',
        
        // Optimize for production
        minify: 'esbuild',
        target: 'es2020',
        
        // Asset optimization
        assetsInlineLimit: 4096, // Inline assets smaller than 4KB
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
