# Refactoring Proxy Tests: A Migration from Jest to Vitest and Nock to MSW

This document outlines the process of migrating the `stream-watcher` proxy's test suite from Jest to Vitest. This refactor was undertaken to align the proxy's tooling with the rest of the monorepo, which uses Vitest. The migration uncovered several challenges related to network request mocking in a Node.js environment, which led to a further refactor from `nock` to Mock Service Worker (`msw`).

## Part 1: Initial Migration from Jest to Vitest

The initial goal was a direct translation of the test framework.

1.  **Dependency Changes**: In `packages/proxy/package.json`, `jest` and its related dependencies (`@types/jest`, `ts-jest`) were removed and replaced with `vitest`. The `test` script was updated to `vitest --run`.

2.  **Configuration**: A `packages/proxy/vitest.config.ts` file was created to configure Vitest, specifically to integrate with TypeScript and define the test environment.

3.  **Code Changes**: All Jest-specific globals were replaced with their Vitest equivalents across the test files (`packages/proxy/src/index.test.ts` and `packages/proxy/src/middleware/auth.test.ts`).
    *   `jest.mock('...')` became `vi.mock('...')`
    *   `jest.fn()` became `vi.fn()`
    *   `jest.spyOn()` became `vi.spyOn()`

## Part 2: Unifying the Mocking Library to MSW

The original tests used `nock` to mock HTTP requests to the JWKS endpoint. However, the rest of the `stream-watcher` project uses `msw` for consistency. The decision was made to refactor the proxy tests to use `msw` as well.

This involved removing `nock` and replacing it with `msw/node`. A central MSW server was configured using `setupServer` and started/stopped for each test file.

## Part 3: Debugging the "Great Interception Failure"

After switching to `msw`, the tests began to fail with a cryptic `getaddrinfo ENOTFOUND mock-jwks-host.com` error. This indicated that our application code was attempting a real DNS lookup and network request, which `msw` was failing to intercept.

### The `jose` and `fetch` Problem

The root cause was traced to the `jose` library, which is used for JWT validation. In modern Node.js environments (v18+), `jose` uses the global `fetch` API to retrieve the JWKS keys.

By default, `msw/node` intercepts requests made via Node's native `http` and `https` modules, but it does **not** intercept calls made to the global `fetch` API without additional setup.

### Solution Attempt 1: The `undici` Polyfill

The standard solution for this issue is to polyfill `globalThis.fetch` with a library that `msw` can patch, such as `undici`. We added the following to our `test-setup.ts` file:

```typescript
// src/test-setup.ts
import { fetch, Request, Response, Headers } from 'undici';

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
  globalThis.Headers = Headers as any;
}
```

This ensured that any `fetch` call within the test environment would be interceptable by `msw`.

### Solution Attempt 2: The Dynamic Port Rabbit Hole

While the polyfill was a step in the right direction, the tests still failed. We incorrectly diagnosed the problem as an issue with `supertest`, which runs the Express server on a random available port. This led us down a complex path of:
1.  Starting the server on port `0` in `beforeEach` to get a dynamic port.
2.  Dynamically updating the mocked `jwksUri` config to point to `http://127.0.0.1:<dynamic_port>`.
3.  Dynamically creating the `msw` handler to intercept requests to that same dynamic URL.

This resulted in a new error: `JWT Verification Error: Expected 200 OK ... but got 404 Not Found`.

The logs showed the request was being handled by our own Express app, not `msw`. The app was receiving a request for a route it didn't have (`/.well-known/jwks.json`) and correctly returning a 404. The request from `jose` was essentially a server-to-itself call, which was being short-circuited and never reached the layer that `msw` patches.

### The Final, Correct Solution

The final solution combined the correct pieces from our previous attempts:

1.  **Keep the `undici` polyfill**. This is essential for allowing `msw` to see `fetch` requests.
2.  **Use a distinct, mock hostname for the external service**. The JWKS URI should **not** point to the running test server.

By setting the `jwksUri` back to a fake domain like `http://mock-jwks-host.com` and creating an `msw` handler for that same domain, we created the correct test conditions:
- The `auth` middleware, running inside our Express app, attempts to `fetch` an external URL (`http://mock-jwks-host.com/...`).
- The `undici` polyfill ensures this `fetch` call is visible to `msw`.
- `msw` intercepts the call because the URL matches its handler.
- The request never attempts a real DNS lookup, avoiding the `ENOTFOUND` error.
- The mocked JWKS data is returned, and the test passes.

This setup correctly isolates the application, allowing `supertest` to test the app's endpoints while `msw` transparently mocks the external dependencies it calls out to. 