import http from 'http';
import { createApp } from './app.js';
import config from './config.js';

const app = createApp(config);
const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`[server]: Proxy is running at http://localhost:${config.port}`);
    console.log(`[server]: Proxying to ${config.bffTargetUrl}`);
});

export default app; 