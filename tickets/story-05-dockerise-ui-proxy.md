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