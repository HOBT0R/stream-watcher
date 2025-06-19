import { createApp } from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 8080;
const bffUrl = process.env.BFF_BASE_URL;

if (!bffUrl) {
    console.error('BFF_BASE_URL is not defined. Please check your .env file.');
    process.exit(1);
}

const app = createApp(bffUrl);

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Proxy server listening on port ${port}`);
        console.log(`Proxying API requests to ${bffUrl}`);
    });
}

export default app; 