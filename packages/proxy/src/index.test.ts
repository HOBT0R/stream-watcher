import request from 'supertest';
import { createApp } from './app';
import http from 'http';

let mockBff: http.Server;
const mockBffPort = 3001;
const bffUrl = `http://localhost:${mockBffPort}`;
const app = createApp(bffUrl); // Create the app instance for testing

beforeAll((done) => {
    mockBff = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ from: 'mock-bff' }));
    });
    mockBff.listen(mockBffPort, done);
});

afterAll((done) => {
    mockBff.close(done);
});


describe('Proxy Server', () => {
    
    describe('GET /healthz', () => {
        it('should return 200 OK and { ok: true }', async () => {
            const res = await request(app).get('/healthz');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ok: true });
        });
    });

    describe('Proxying to BFF', () => {
        it('should proxy GET /api/some/path to the mock BFF', async () => {
            const res = await request(app).get('/api/some/path');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ from: 'mock-bff' });
        });
    });
}); 