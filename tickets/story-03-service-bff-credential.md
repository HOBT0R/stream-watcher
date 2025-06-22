Status: Complete
Date: 2024-06-20

---

# Story: Service-to-BFF Credential

As a developer, I want the Node.js proxy to add a secret `x-service-key` header to every request it forwards to the BFF, so that the BFF can trust the request's origin.

## Acceptance Criteria
-   The proxy reads a secret value for the `bffApiKey` from its configuration.
-   When using `http-proxy-middleware`, an `onProxyReq` handler is configured.
-   Inside the handler, the `proxyReq.setHeader('x-service-key', config.bffApiKey)` method is called to attach the secret header.
-   An `onProxyRes` handler is configured to remove the `x-service-key` header from the response before it's sent back to the client, preventing the key from leaking.
-   The functionality is tested by asserting that a mock downstream service receives the header.

## Tasks
-   [x] Update `http-proxy-middleware` configuration in `src/app.ts`.
-   [x] Add the `onProxyReq` handler to set the `x-service-key` header.
-   [x] Add the `onProxyRes` handler to strip the header from the response.
-   [x] Write a test in `src/app.test.ts` that:
    -   [x] Mocks an API endpoint.
    -   [x] Sends a request to the proxy.
    -   [x] Asserts that the mock endpoint receives the request with the correct `x-service-key` header.

## Definition of Done
-   All ACs are met.
-   Code is reviewed and merged to the main branch.
-   Tests are passing in CI.

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