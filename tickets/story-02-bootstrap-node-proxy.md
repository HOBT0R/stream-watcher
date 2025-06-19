# Story 1 – Bootstrap Node Proxy

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 1 developer-day

## Context
We need a thin Express server that proxies `/api/**` requests from the UI to the BFF while running locally and in Cloud Run. This story establishes the skeleton code, environment handling, and a basic health-check endpoint.

## Acceptance Criteria
1. **Express App** – New package (e.g., `packages/proxy`) containing an Express 5 app.
2. **Proxy Middleware** – Requests under `/api/*` are forwarded to `process.env.BFF_BASE_URL` using `http-proxy-middleware`.
3. **Health Endpoint** – `GET /healthz` returns HTTP 200 with body `{ ok: true }`.
4. **Environment Loading** – `.env` file parsed via `dotenv` in non-prod environments.
5. **TypeScript** – App built with `ts-node` / `ts-node-esm` or compiled via `tsc`.
6. **Scripts** – `npm run dev` runs `nodemon` + UI concurrently; `npm start` runs compiled code.
7. **Tests** – Jest + Supertest cover at least the health endpoint and a happy-path proxy request.

## Technical Notes
* Scaffold with `npx degit expressjs/express#master` or similar starter.
* Use `concurrently` (already in repo) to run UI + proxy in dev.
* Keep listen port default `8080` to match Cloud Run defaults.

### Health Check Details
* **Route:** `GET /healthz`
* **Success Criteria (200 OK):**
  1. Express process is running and listening.
  2. Environment variables `BFF_BASE_URL` and `PORT` are loaded.
  3. Optional (toggle via `HEALTH_LIVE_ONLY`): make a 1-second HEAD request to `${BFF_BASE_URL}/healthz` and include upstream status in the JSON payload `{ ok: true, upstream: '200' }`.  Failure to reach upstream within the timeout returns **503** so Cloud Run knows to restart or stop routing traffic.
* **Response Body:**
  ```json
  { "ok": true }
  ```
  or with upstream probe enabled:
  ```json
  { "ok": true, "upstream": "200" }
  ```
* **Cache-Control:** `no-store` to avoid Cloud Run caching the response. 