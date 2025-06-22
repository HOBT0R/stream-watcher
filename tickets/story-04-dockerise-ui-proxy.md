Status: Complete
Date: 2024-06-20

---

# Story: Dockerise UI + Proxy

As a developer, I want to create a multi-stage `Dockerfile` that builds and bundles the React UI and the Node.js proxy into a single, production-ready container image.

## Acceptance Criteria
-   A `Dockerfile` exists at the root of the repository.
-   It uses a multi-stage build approach to keep the final image size small.
-   **Stage 1 ("ui-builder"):**
    -   Starts from a `node` base image.
    -   Copies the UI source code (`src`, `public`, `package.json`, etc.).
    -   Installs dependencies and runs `npm run build` to generate the static UI assets in `/dist`.
-   **Stage 2 ("proxy-builder"):**
    -   Starts from a `node` base image.
    -   Copies the proxy source code (`packages/proxy/src`, `packages/proxy/package.json`, etc.).
    -   Installs proxy dependencies and runs `npm run build` to generate the compiled proxy code in `packages/proxy/dist`.
-   **Stage 3 (Final Image):**
    -   Starts from a slim `node` base image (e.g., `node:20-slim`).
    -   Copies the built UI assets from the `ui-builder` stage (`/dist`).
    -   Copies the built proxy code from the `proxy-builder` stage (`packages/proxy/dist`).
    -   Installs *only* the production dependencies for the proxy.
    -   Sets the `CMD` to start the Node.js proxy server.
-   A `.dockerignore` file exists to exclude `node_modules`, `.git`, and other unnecessary files from the build context.

## Tasks
-   [x] Create a `Dockerfile` in the root directory.
-   [x] Implement the multi-stage build as described in the ACs.
-   [x] Create a `.dockerignore` file.
-   [] Add a script to `package.json` for building the Docker image (e.g., `docker:build`).
-   [] Test the Docker image locally to ensure it starts and the UI is accessible.

## Definition of Done
-   All ACs are met.
-   The Docker image builds successfully.
-   The container runs without errors and serves both the UI and the proxy.
-   Code is reviewed and merged to the main branch.

# Story 4 – Dockerise UI + Proxy

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 0.8 developer-day

## Context
We need a container image that bundles the static React build (`vite build`) and the Node proxy for deployment to Cloud Run.

## Acceptance Criteria
1. **Multi-stage Dockerfile** – Produces minimal runtime image (< 300 MB) tagged `ui-proxy:<sha>`.
2. **.dockerignore** – Excludes `node_modules`, `dist`, test artifacts, and local configs.
3. **Local Compose** – `docker compose up` starts:
   * `ui-proxy` container (port 8080)
   * `mock-bff` container using `nginx` or `json-server` for integration testing
4. **Image Test** – GitHub Action builds image and runs `curl http://localhost:8080/healthz` to verify container boots.
5. **Docs** – README updated with build & run commands.

## Technical Notes
* Use `node:20-alpine` for both build and runtime stages.
* Use `npm ci --omit=dev` in the build stage for deterministic installs.

## Local Compose Setup
Add `docker-compose.yaml` in repo root:
```yaml
version: "3.9"
services:
  ui-proxy:
    build: .
    ports: ["8080:8080"]
    env_file: .env.local
    volumes:
      - ./dev_public.pem:/secrets/jwt_pub.pem:ro  # mount dev key
    environment:
      JWT_PUBLIC_KEY: file:///secrets/jwt_pub.pem
  mock-bff:
    image: node:20-alpine
    command: sh -c "npx json-server --watch mock.json --port 3000"
    volumes:
      - ./mock.json:/mock.json:ro
    ports: ["3000:3000"]
```

### Usage
```bash
docker compose build
docker compose up -d
# Mint token and hit endpoint
TOKEN=$(node scripts/makeToken.ts)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/channels
```

Compose file lives outside production image and is excluded from the Docker context.