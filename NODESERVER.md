# EPIC: Node Server Proxy & CI/CD Integration

## Overview
The React front-end should never speak directly to the BFF (Backend-for-Frontend) once both services are deployed to the cloud.  Instead, a small Node.js **proxy server** will live alongside the UI and relay all API traffic to the BFF.  This keeps the BFF's surface area private, allows us to inject authentication, and gives us a central point for logging, rate-limiting, and other cross-cutting concerns.

```
┌──────────────────┐        ┌────────────┐        ┌────────────┐
│   Browser (UI)   │  HTTPS │  Node App  │  HTTPS │    BFF     │
└──────────────────┘  --->  └────────────┘  --->  └────────────┘
                                   │                │
                                   ▼                ▼
                           (Future micro-services, databases, etc.)
```

## Goals
1. **Security** – expose only a single public endpoint (the Node app).  The BFF will be reachable **only** from the Node app's VPC / private network.
2. **Zero UI Changes** – keep the existing REST contracts so no component code changes other than the base URL.
3. **Transparent Proxy** – request/response payloads should flow unchanged unless explicitly required (e.g., auth headers).
4. **Extensibility** – easy to plug in logging, tracing, rate-limiting or caching later.

## Non-Goals
• Re-implementing business logic that already exists in the BFF.  The Node server is a thin pass-through.

## Technical Design
### Tech Stack
• **Node.js ≥ 20**  
• **Express 5** as the HTTP framework  
• **http-proxy-middleware** for low-level proxying  
• **dotenv** for environment management (local only)  
• **Jest + Supertest** for unit/integration tests  

### Route Mapping
| UI Path | Proxy Path | Target BFF Path |
|---------|------------|-----------------|
| `/api/channels` | `/api/channels` | `${BFF_BASE_URL}/api/channels` |
| `/api/channels/:name` | `/api/channels/:name` | `${BFF_BASE_URL}/api/channels/:name` |
| ... | ... | ... |

> Add additional rows as new endpoints are added to the UI.

### Authentication & Headers
1. **Client-side Auth** – The UI will attach a JWT or session cookie (`STREAM_AUTH_TOKEN`).  The Node app will verify it using the same secret/public key as the BFF.
2. **Service Credential** – Calls from Node → BFF will include `x-service-key` whose value is read from the **bundled config** (see `NODE_CONFIG_JSON`).
3. Strip any `Set-Cookie`, `Server` and other sensitive headers in responses.

### Secret Bundling (GSM Free-tier)
To stay within the six-secret quota, **all** sensitive values are packed into a single JSON env var:
```json
{
  "bffApiKey": "<string>",
  "jwtPublicKey": "-----BEGIN PUBLIC KEY-----…",
  "rateLimit": { "windowMs": 60000, "max": 60 }
}
```
This blob is stored as one Secret-Manager secret and mounted at runtime as `NODE_CONFIG_JSON`.
The app will parse it at startup via `config-provider.ts`.

### Error Handling
* Upstream 4xx/5xx errors should be forwarded with the original status code and body.
* A generic 502 *"Bad Gateway – Upstream Error"* will be returned if the BFF is unreachable (timeout > 10 s).

### Logging & Metrics
* Use `morgan` for HTTP access logs in combined format (JSON in prod).
* Expose a `/healthz` endpoint returning `{ ok: true }` for Kubernetes liveness probes.

### Rate Limiting (Phase 2)
* Use `express-rate-limit`; initially disabled via `RATE_LIMIT_ENABLED=false` env var.

### Environment Variables
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `PORT` | No | `8080` | Port Node server listens on |
| `BFF_BASE_URL` | Yes | – | Full base URL for the BFF service |
| `NODE_CONFIG_JSON` | Yes (prod) | `{}` | Bundled secrets JSON (read **once** at startup) |
| `RATE_LIMIT_ENABLED` | No | `false` | Toggle rate limiting |

### Local Development
1. `npm install` (workspace-wide).  
2. Copy `.env.example` → `.env` and set `BFF_BASE_URL=http://localhost:3000`.  
3. Run `npm run dev` – this executes `vite` and `nodemon` concurrently.  
4. All UI HTTP calls now hit `http://localhost:8080/...` and are proxied to the local BFF.

### Testing Strategy
* **Unit** – Validate auth middleware, header-sanitiser, and common error branches.
* **Integration** – Spin up a mock BFF using `msw` or `nock` and assert complete request/response flow.
* Goal: ≥ 95 % coverage for the proxy server package.

### Deployment
* The Node proxy and static UI bundle live in the same Docker image.
* **Artifact Registry** (GCP) hosts version-tagged images: `us-docker.pkg.dev/<gcp-project>/stream-watcher/ui-proxy:<sha>`.
* The image is deployed to **Cloud Run** service `stream-watcher-ui-proxy` with:
  * Region: `us-central1` (covered by Always-Free tier).
  * `min-instances=0` (scale-to-zero, no idle cost).
  * `max-instances=3` (to stay within free concurrency limits).
  * Environment variables wired via Cloud Run Secret Manager references.
* CI/CD steps (GitHub Actions):
  1. `npm run lint && npm test`.
  2. Build & push image using `gcloud auth docker` + `docker build && docker push` **or** `gcloud builds submit`.
  3. `gcloud run deploy stream-watcher-ui-proxy --image us-docker.pkg.dev/<gcp-project>/stream-watcher/ui-proxy:<sha> --region us-central1 --platform managed --quiet`.

---

## Acceptance Criteria
1. **Security** – The BFF is *not* resolvable from the public internet; verified with penetration test or port scan.
2. **Functionality** – The UI performs all existing operations (list channels, edit channel, etc.) through `https://<cloud-run-domain>/api/...` without code changes beyond base URL.
3. **Observability** – Request/response logs and errors are visible in **Cloud Logging** and metrics in **Cloud Monitoring**.
4. **Tests** – Pipeline fails if coverage < 95 % or any route test fails.
5. **Docs** – README updated with local dev instructions.

---

## Milestones & Est. Effort
| Milestone | Tasks | Est. (d) |
|-----------|-------|----------|
| 1 – Bootstrap | Scaffold Express app, add proxy middleware, env validation | 1 |
| 2 – Auth | Implement JWT verification, forward service key | 1 |
| 3 – UI Cut-over | Change UI base URL, smoke test | 0.5 |
| 4 – CI/CD | Dockerfile, GH Actions, k8s manifests | 1 |
| 5 – Hardening | Logging, rate-limit, health checks | 0.5 |

_Total ≈ 4 developer-days._

---

## User Stories & Acceptance Criteria

| # | Title | Acceptance Criteria | Est. (d) |
|---|-------|---------------------|----------|
| 1 | **Bootstrap Node Proxy** | • Express app scaffolding with `http-proxy-middleware` forwarding `/api/*`.<br/>• Configuration loaded **once at start-up** from `NODE_CONFIG_JSON`.<br/>• `.env` file parsed via `dotenv`.<br/>• `/healthz` returns `{ ok: true }`. | 1 |
| 2 | **Add JWT Verification** | • Middleware validates JWT via public key / JWKS.<br/>• 401 on failure, `req.user` on success. | 1 |
| 3 | **Service-to-BFF Credential** | • Reads `bffApiKey` from `NODE_CONFIG_JSON`.<br/>• `x-service-key` header added to each proxied request and stripped from responses.<br/>• Rotation docs updated. | 0.2 |
| 4 | **Dockerise UI + Proxy** | • Multi-stage Dockerfile, `.dockerignore`, local compose, image test. | 0.8 |
| 5 | **CI Pipeline** | • GitHub Action caches npm cache.<br/>• Runs `npm run lint` & coverage tests.<br/>• Builds & pushes image. | 1 |
| 6 | **CD Pipeline (Cloud Run)** | • Workflow deploys image to Cloud Run and hits `/healthz`. | 0.5 |
| 7 | **Observability & Logging** | • Structured logs in Cloud Logging; custom metrics. | 0.3 |
| 8 | **Rate Limiting (Phase 2)** | • `express-rate-limit` behind feature flag.<br/>• 429 with `Retry-After`. | 0.3 |

_Total Epic Effort ≈ 5.1 developer-days._

---

## Open Questions
* Do we need WebSockets for live updates, or will polling remain sufficient?
* Should rate limiting be enforced at an API-gateway layer instead of the Node app?
* How will service-to-service auth between Node and BFF evolve (mutual TLS, OAuth 2.0 client-cred, etc.)?

Please answer or refine these during implementation.