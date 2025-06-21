import { fetch, Request, Response, Headers } from 'undici';

// -----------------------------------------------------------
// Test Bootstrap for the proxy package
// -----------------------------------------------------------
// We **always** override Node's native `fetch` implementation with the
// Undici polyfill so that MSW can intercept *every* outbound request.
// -----------------------------------------------------------
// Why is this necessary?
// • Node 18+ ships its own global `fetch`.  That implementation is not
//   patch-able by MSW because the global property is defined as
//   `{ configurable:false }`.
// • The `jose` JWT library uses whatever `fetch` lives on `globalThis` to
//   download a JWKS.  If MSW cannot hook into that call, `jose` will make a
//   *real* HTTP/DNS request during unit tests and will blow up with an
//   `ENOTFOUND` error.
// • Re-assigning the global symbols to Undici's implementations gives MSW a
//   patch-able surface and keeps **all** tests hermetic.
//
// IMPORTANT: keep this file out of production builds – it is imported only by
// Vitest via `setupFiles`.
// -----------------------------------------------------------

// Always override Node's native fetch implementation so that MSW can intercept
// requests triggered by the `jose` library during tests.  Node 18+ ships its
// own `fetch`, but MSW cannot patch that implementation because the global
// property is non-configurable.  Re-assigning here guarantees that MSW's
// interception layer (which monkey-patches `undici` fetch) will be used.
// See: https://github.com/mswjs/msw/issues/1884
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
globalThis.fetch = fetch;
// @ts-ignore
globalThis.Request = Request;
// @ts-ignore
globalThis.Response = Response;
// @ts-ignore
globalThis.Headers = Headers; 