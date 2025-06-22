import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['packages/proxy/src/test-setup.ts'],
        include: ['packages/proxy/**/*.test.ts'],
    },
}); 