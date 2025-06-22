# Proxy Debugging Log – Root-Cause Analysis & Fixes

This document records every step we took while diagnosing the **`/api/v1/statuses` 504 / 403 / 408** issues and the fixes that ultimately resolved them.

---

## Timeline of Investigation

| Step | Action | Result |
|------|--------|--------|
| 1 | Added basic `console.log` statements in `packages/proxy/src/app.ts` (`[Inbound]`, `[ProxyReq]`, `[ProxyRes]`, etc.) | Confirmed request reached Express but never the proxy middleware. |
| 2 | Added `[BeforeProxy]` middleware and saw `url=/v1/statuses` (mount path stripped). Introduced **`pathRewrite`** to restore `/api` prefix. | Proxy still stalled – no outbound request. |
| 3 | Noticed `ECONNREFUSED` when curling `localhost:3000` *inside* the container. Changed **`BFF_BASE_URL → host.docker.internal`**. | Proxy now connected but BFF returned **403 "Invalid CORS request"**. |
| 4 | Overwrote `Origin` header in `onProxyReq` → `origin = config.bffBaseUrl`. | 403 resolved, but proxy still silent. |
| 5 | Container logs showed socket reset. Verified that large payload worked *directly* against BFF → proxy must be corrupting body. |
| 6 | Realised `express.json()` was consuming the body **before** proxy saw it (body became empty). Moved `express.json()` **after** proxy registration. | BFF now returns **200 OK** through proxy. |
| 7 | Added 10-second `proxyTimeout` / `timeout` so hangs fail fast. | Proxy now fails quickly if upstream misbehaves. |
| 8 | Added ISO-timestamp helper (`ts()`) and minimal logs for long-term diagnostics. | Provides clear duration metrics in logs. |
| 9 | Enabled `DEBUG=http-proxy-middleware:*` in compose for library-level tracing. | Extra `HPM …` lines available when needed. |

## Final Fixes Now in Code

1. **Origin rewrite** – `headers.origin = config.bffBaseUrl` inside `proxyOptions` to satisfy BFF CORS filter.
2. **Service key** – `x-service-key` header added in `onProxyReq`.
3. **Path rewrite** – `pathRewrite` prepends `/api` because Express strips the mount path.
4. **Fast-fail timeouts** – `proxyTimeout` & `timeout` both set to **10 s**.
5. **Body preservation** – `express.json()` moved **after** `createProxyMiddleware` so raw request bodies are piped through untouched.
6. **Timestamped logging** – lightweight `[Inbound]`, `[BeforeProxy]`, `[PathRewrite]`, `[ProxyReq]`, `[ProxyRes]`, and `[ProxyError]` lines with `ts()` helper.
7. **Library debug switch** – `DEBUG=http-proxy-middleware:*` set in `docker-compose.yaml` for on-demand deep tracing.

With these fixes the reverse-proxy now:
• Authenticates the Firebase ID-token (unless `SKIP_JWT_VERIFY=true`).
• Adds the service-key header.
• Forwards payloads intact (any size) to the BFF.
• Logs each phase with timestamps.
• Fails fast if the BFF closes the socket or hangs.

---

## Relation to Stories

* **Story-09 – Refactor Google Auth**: debugging uncovered the need to preserve raw request bodies for JWT processing and to forward `x-service-key`; both are relevant for that refactor.
* **Story-11 – Firebase Auth Emulator Integration**: timestamps and Origin-rewrite workarounds ensured the proxy cooperates with the local auth emulator.

## Clean-up Checklist (when ready for production)

- [ ] Remove or downgrade `DEBUG=http-proxy-middleware:*` (or gate it behind an env toggle).
- [ ] Replace timestamped `console.log` statements with structured logging (e.g., pino, winston) or remove entirely.
- [ ] Re-evaluate 10 s timeouts – tune to SLA.
- [ ] Keep `express.json()` positioning (critical) but ensure any new routes that need `req.body` are defined *after* the proxy.
- [ ] Delete this file when all above items are resolved.

* Inbound log now includes the `Content-Length` request header.
* Moved `express.json()` middleware to **after** the proxy so the raw request body is preserved for `/api` calls. This should resolve `I/O error while reading input message` reported by the BFF.
* Startup log now prints `BFF_API_KEY` value; `[ProxyReq]` line now shows the `x-service-key` header value.
* Restored `x-service-key` in static `headers` so it is present during http-proxy-middleware pre-checks (fixes 403 when BFF auth enabled).
* **June 21** – Removed all temporary console logging and debug middleware; only functional code remains.