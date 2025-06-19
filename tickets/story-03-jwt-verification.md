# Story 2 – Add JWT Verification

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 1 developer-day

## Context
The proxy must authenticate incoming requests from the browser. Tokens are signed by an external IdP or Firebase Auth. We will verify the signature and claims before forwarding to the BFF.

## Acceptance Criteria
1. **Middleware** – `verifyToken` Express middleware verifies `Authorization: Bearer <jwt>` header.
2. **JWKS / Public Key Config** – Middleware uses key or JWKS URL stored in Secret Manager and injected as `$JWT_PUBLIC_KEY`.
3. **Claims Validation** – `iss`, `aud`, `exp`, `nbf`, and `iat` are validated. Tokens older than 15 min or without required claims are rejected.
4. **Error Handling** – Invalid or missing token causes HTTP 401 with JSON `{ error: 'unauthorized' }`.
5. **Downstream User Info** – On success, `req.user = { sub, role }` is populated for logging.
6. **Tests** – Unit tests cover success, expired token, wrong audience, bad signature.

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