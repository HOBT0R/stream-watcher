Status: Complete
Date: 2024-06-20

---

# Story: Add JWT Verification

As a developer, I want to add JWT verification middleware to the Node.js proxy, so that we can secure the proxied endpoints.

## Acceptance Criteria
-   A new middleware function `verifyToken` is created in `packages/proxy/src/middleware/auth.ts`.
-   The middleware extracts a JWT from the `Authorization: Bearer <token>` header.
-   It uses the `jose` library to verify the token against a JWKS endpoint.
-   The JWKS URI, expected issuer, and audience are read from the application config.
-   If the token is missing, malformed, or invalid (bad signature, expired, etc.), the middleware returns a `401 Unauthorized` response with a JSON error object.
-   If the token is valid, the middleware calls `next()` and attaches the token's payload (or a subset of it, like `sub`) to the `req.user` object.
-   The middleware is tested in isolation with mock requests and a mocked JWKS endpoint.

## Tasks
-   [x] Add `jose` to `packages/proxy` dependencies.
-   [x] Create `src/middleware/auth.ts` with the `verifyToken` function.
-   [x] Implement the logic to extract and verify the token.
-   [x] Add the new JWT config properties (`jwksUri`, `issuer`, `audience`) to the config module.
-   [x] Create `src/middleware/auth.test.ts` to unit test the middleware.
-   [x] Write test cases for:
    -   [x] No token provided
    -   [x] Malformed token
    -   [x] Invalid signature
    -   [x] Incorrect issuer/audience
    -   [x] Expired token
    -   [x] Valid token
-   [x] Use MSW to mock the JWKS endpoint for tests.

## Definition of Done
-   All ACs are met.
-   Code is reviewed and merged to the main branch.
-   All tests for the auth middleware are passing in CI, with >95% coverage.

# Story 2 – Add JWT Verification

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 1 developer-day

## Context
The proxy must authenticate incoming requests from the browser. Tokens are signed by an external IdP or Firebase Auth. We will verify the signature and claims before forwarding to the BFF.

## Technical Notes
* Use `jose` library (ESM friendly, 0 deps) for verification.
* Cache JWKS to reduce external calls.
* Add rate-limit exemption for `/healthz`.

## Local Development & Testing
### Dev Key Pair
1. Generate temporary RSA keys (put them in project root, git-ignored):
   ```bash
   openssl genrsa -out dev_private.pem 2048
   openssl rsa -in dev_private.pem -pubout -out dev_public.pem
   ```
2. Add `dev_private.pem` & `dev_public.pem` to `.gitignore`.

### .env.local
```
PORT=8080
BFF_BASE_URL=http://localhost:3000   # or mock-bff container when using compose
JWT_PUBLIC_KEY=file://./dev_public.pem
BFF_API_KEY=dev-secret
```

### Minting Test Tokens
Create `scripts/makeToken.ts`:
```ts
import { SignJWT } from 'jose';
import fs from 'fs';
const pk = fs.readFileSync('dev_private.pem');
(async () => {
  const jwt = await new SignJWT({ sub: 'alice', role: 'admin' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer('http://localhost:8080')
    .setAudience('stream-watcher')
    .setExpirationTime('15m')
    .sign(pk);
  console.log(jwt);
})();
```
Run `node -r ts-node/register scripts/makeToken.ts` to obtain a test JWT.

### Manual Curl Test
```bash
TOKEN=$(node scripts/makeToken.ts)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/channels
```
Should proxy through when the middleware accepts the token; otherwise returns 401. 