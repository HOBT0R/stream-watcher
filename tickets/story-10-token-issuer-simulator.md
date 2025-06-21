Status: NOT NEEDED
Date: 2025-06-20

---

# Story: Token-Issuer Simulator (JWKS + JWT)

Build a lightweight service that pretends to be Google's OAuth public-key endpoint so that the proxy container can verify RS256-signed JWTs in **Docker / QA** deployments.

## Acceptance Criteria
1. A new package `packages/token-issuer` (or a sub-folder in `proxy`) exposes:
   • `POST /token` — mints a RS256 JWT signed with `dev_private.pem`.
   • `GET /.well-known/jwks.json` (and legacy `/certs`) — serves a JWKS containing the matching public key.
2. JWT contents:
   • Header: `alg=RS256`, `typ=JWT`, `kid=dev-key`.
   • Claims: `sub` (from query/body), `iss=https://issuer.local`, `aud=stream-watcher-docker`, `exp` 15 min.
3. On startup the service **generates a fresh RSA-2048 key-pair in memory** (using `jose`), keeps the private key in process memory only, and exposes the public key via the JWKS endpoint.  Optionally, if `PERSIST_KEYS_DIR=/keys` is provided, it writes `private.pem` and `public.pem` there so subsequent container restarts can reuse them.
4. Docker image < 25 MB, multi-stage build on `node:20-alpine`.
5. Added to `docker-compose.yaml` as service `token-issuer`, bind-mounting the keypair under `/secrets/`.
6. Proxy service passes tests using issuer's JWKS endpoint (set `JWT_JWKS_URI=http://token-issuer:8081/.well-known/jwks.json`).
7. Unit tests cover signing and JWKS output (Vitest ≥ 90 % coverage).

## Tasks
- [ ] Scaffold new Node/TS project (`npm init -w packages/token-issuer`).
- [ ] Add deps `jose`, `express`, `cors`, `dotenv`.
- [ ] Implement `src/server.ts` with `/token` and `/.well-known/jwks.json` endpoints.
- [ ] Parse `kid`, `sub`, `aud`, `iss`, `exp` from request body or defaults.
- [ ] Write unit tests with Vitest & Supertest.
- [ ] Create `Dockerfile` (multi-stage) reusing `node:20-alpine`; embeds `scripts/makeKeys.ts` & `makeToken.ts`.
- [ ] Update `docker-compose.yaml` (ports 8081:8081); no secret mounts required.  Add optional volume for `PERSIST_KEYS_DIR` if stable keys are desired.
- [ ] Update proxy `.env.docker` example: set `JWT_JWKS_URI=http://token-issuer:8081/.well-known/jwks.json` and clear `JWT_PUBLIC_KEY`.
- [ ] Document usage in `packages/token-issuer/README.md`.
- [ ] Add "dev-only" eslint banner & package.json flag.
- [ ] Ensure prod CI job fails if `packages/token-issuer` artefacts appear.
- [ ] Document the separation in README and TESTPLAN.
- [ ] Add setup section to root `README.md` explaining how to enable `token-issuer` in the docker-compose stack.
- [ ] Document usage & CLI examples in `packages/token-issuer/README.md`.
- [ ] Create `deploy-token-issuer.sh` (modeled on `deploy.sh`) that builds/pushes the simulator image to a Raspberry Pi and starts it via `docker run` or `systemd`.

### Prod-Safety / Separation
- [ ] Add `// DEV-ONLY` banner comment and ESLint rule (`no-prod-publish`) to simulator source (including runtime key generation logic).
- [ ] Put package inside `packages/dev-only/` and exclude it from root `workspaces` (`package.json workspaces.exclude`).
- [ ] Provide a dedicated `Dockerfile.dev` (or build target `simulator`) that is **not** referenced by prod CI.
- [ ] Update CI: prod workflow fails if artefacts from `packages/dev-only` appear (`grep -R "token-issuer" dist/ && exit 1`).
- [ ] Ensure proxy refuses to start with `NODE_ENV=production` when `JWT_JWKS_URI` points at `token-issuer` (simple runtime check).
- [ ] Add section "Dev-Only Simulator, never ship to prod" in root README/TESTPLAN.

## Definition of Done
- All ACs satisfied.
- CI passes (lint, test, type-check, build, docker-build).
- Docs updated; keys remain git-ignored.

**Epic:** Auth & Local Environments
**Estimate:** 1 dev-day

--- 