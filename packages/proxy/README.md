# Stream-Watcher Proxy Service

This Node-Express service acts as a Backend-For-Frontend (BFF):

* Serves the pre-built React UI from `/dist`.
* Proxies `/api/*` requests to the upstream BFF ("mock-bff" during dev).
* Verifies incoming JWTs using either a static PEM public key **or** a JWKS URI.

---

## Directory layout

```
packages/
  proxy/
    src/            # TypeScript source
    dist/           # Compiled output (build step)
    dev_public.pem  # Example public key for local JWT verification
    dev_private.pem # Matches the public key, used only to mint test tokens
    example.env.*   # Sample environment-variable files (see below)
```

---

## Environment Files

| file | purpose |
|------|---------|
| `example.env.local` | Copy to `.env.local` for **`npm run dev`**. Uses a local PEM key. |
| `example.env.docker` | Copy to `.env.docker` (used by `docker-compose`). Expects the PEM to be bind-mounted to `/secrets/jwt_pub.pem`. |
| `example.env.production` | Template for Cloud Run / production. Uses Google JWKS or any public JWKS endpoint. |

All variables are documented inline in the example files.

> **Important:** never commit real secrets; commit only the `example.*` templates.

---

## Environment profiles

The same Docker image runs in three **profiles** that differ only in their *configuration*, never in code:

| Profile | Where you run it | Purpose | Auth state | Secrets provided via |
|---------|------------------|---------|------------|---------------------|
| **Local** | Laptop / workstation, started with `npm run dev` | Fast iteration and UI/Proxy integration testing on a single machine | **Disabled** – we set `SKIP_JWT_VERIFY=true` so no token is required | None – public key & JWKS settings are ignored |
| **Docker** | Any host capable of Docker (e.g. Raspberry Pi), started with `docker compose up` or `docker run` | Reproduces _production_ behaviour for on-prem appliances and QA | **Enabled** – JWTs are verified using the **PEM** file bind-mounted to `/secrets/jwt_pub.pem` (referenced by `JWT_PUBLIC_KEY=file:///secrets/jwt_pub.pem`) | 1. `.env.docker` file baked or mounted at runtime<br/>2. The mounted PEM public key |
| **Production** | Cloud Run / Kubernetes on GCP | Same behaviour as Docker, but with cloud-native secret handling | **Enabled** – JWTs are verified (either PEM or JWKS) | Google Secret Manager / K8s Secret → injected as env-vars or files |

Guidelines

1. **Never** set `SKIP_JWT_VERIFY=true` outside of the *Local* profile.
2. Either `JWT_PUBLIC_KEY` **or** `JWT_JWKS_URI` must be non-empty when auth is enabled.
3. The container image is identical across profiles – switching profiles is purely a matter of passing the correct `.env.*` file and, for Docker/Prod, the PEM file or JWKS URI.

---

## Environment variable reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| **Frontend / Vite** ||||
| `VITE_FIREBASE_API_KEY` | yes (UI) | `AIza...` | Public key for Firebase Web SDK. Must begin with `VITE_` so Vite exposes it to the browser bundle. |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | `my-app.firebaseapp.com` | Firebase auth domain. |
| `VITE_FIREBASE_PROJECT_ID` | yes | `my-app` | GCP project id. |
| `VITE_FIREBASE_STORAGE_BUCKET` | optional |  | Storage bucket name. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | optional |  | FCM sender id. |
| `VITE_FIREBASE_APP_ID` | yes | `1:...:web:...` | Firebase app id. |
| **Proxy → BFF** ||||
| `BFF_BASE_URL` | yes | `http://localhost:3000` | Base URL to which all `/api/*` paths are forwarded. |
| `BFF_API_KEY` | yes | `super-secret` | Added as `x-service-key` header on every proxied request. |
| `PORT` | optional | `8080` (default) | Port the proxy listens on inside the container. |
| **JWT verification** ||||
| `JWT_PUBLIC_KEY` | required *or* `JWT_JWKS_URI` | `file:///secrets/jwt_pub.pem` | Local or remote **PEM** public key used to verify incoming JWTs. Use the `file://` prefix for file paths. |
| `JWT_JWKS_URI` | required *or* `JWT_PUBLIC_KEY` | `https://www.googleapis.com/oauth2/v3/certs` | URI returning a JWKS document. If set, overrides `JWT_PUBLIC_KEY`. |
| `JWT_ISSUER` | recommended | `stream-watcher-local` | Expected `iss` claim in the JWT. Empty string disables issuer check. |
| `JWT_AUDIENCE` | recommended | `stream-watcher-dev` | Expected `aud` claim. Empty disables check. |
| `SKIP_JWT_VERIFY` | dev-only | `true` | If `true` the proxy bypasses all JWT checks. Never enable in production. |

**Selection rules**
1. If `SKIP_JWT_VERIFY=true` ➜ no token validation.
2. Else if `JWT_PUBLIC_KEY` is non-empty ➜ validate against that key.
3. Else validate using remote `JWT_JWKS_URI`.

---

## Local development

```bash
# ① Install deps & build React once
npm install
npm run build:ui

# ② Start dev servers (Vite on 5173, proxy on 8080)
cp packages/proxy/example.env.local packages/proxy/.env
npm run dev
```

Mint a test JWT signed with the accompanying private key:

```bash
node packages/proxy/scripts/makeToken.ts \
     --sub demo --aud stream-watcher-dev --iss stream-watcher-local \
     --kid dev-key --private-key packages/proxy/dev_private.pem
```

Attach the token as `Authorization: Bearer …` in requests.

---

## Docker compose

```bash
cp packages/proxy/example.env.docker .env.docker
# ensure dev_public.pem exists at packages/proxy/

docker compose up --build -d
open http://localhost:8080/
```

The compose file:
* Builds the UI + proxy multi-stage image.
* Mounts `dev_public.pem` into the container.
* Publishes port 8080.

---

## Production deployment

Create a secret-managed `.env.production` (see template) and feed it to Cloud Run / Kubernetes.

Set **either** `JWT_PUBLIC_KEY` *or* the trio `JWT_JWKS_URI`, `JWT_ISSUER`, `JWT_AUDIENCE`.

---

### Skipping JWT verification (debug only)

Set `SKIP_JWT_VERIFY=true` in any env file. The proxy will bypass authentication; **never enable this in production**. 