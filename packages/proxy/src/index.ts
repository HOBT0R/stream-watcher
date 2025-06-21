import http from 'http';
import { createApp } from './app.js';
import config from './config.js';

const app = createApp(config);
const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`Proxy server listening on port ${config.port}`);
    console.log(`Proxying API requests to ${config.bffBaseUrl}`);
});

export default app; 