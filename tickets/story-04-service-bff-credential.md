# Story 3 – Service-to-BFF Credential

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 0.2 developer-day

## Context
The BFF must trust that calls originate from the Node proxy, not arbitrary clients. A shared secret `x-service-key` header will be added by the proxy and validated by the BFF.

## Acceptance Criteria
1. **Secret Storage** – `bff_api_key` stored in Secret Manager; mounted as env-var `$BFF_API_KEY` in Cloud Run.
2. **Middleware** – `addServiceKey` inserts `x-service-key: $BFF_API_KEY` into every proxied request and strips it from responses.
3. **Security** – Header is *never* sent back to the browser or logged in plaintext.
4. **Rotation** – README docs include steps to rotate secret using Secret Manager versions.
5. **Tests** – Unit test asserts header present on proxy request.

## Technical Notes
* Use `onProxyReq` hook of `http-proxy-middleware` to mutate outbound request. 