import http from 'http';
import { createApp } from './app.js';
import { getValidatedConfigAsLegacy, getValidatedConfig } from './config/index.js';

// Validate configuration at startup - will exit process if invalid
const config = getValidatedConfigAsLegacy();
const validatedConfig = getValidatedConfig();

const app = createApp(config, validatedConfig);
const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`[server]: Proxy is running at http://localhost:${config.port}`);
    console.log(`[server]: Proxying to ${config.bffTargetUrl}`);
});

export default app; 