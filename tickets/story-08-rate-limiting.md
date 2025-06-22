# Story 8 – Rate Limiting (Phase 2)

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 0.3 developer-day

## Context
To guard against abuse and runaway front-end code, we'll enforce per-IP and per-JWT request limits using `express-rate-limit`. This is an optional, feature-flagged enhancement enabled via env vars.

## Acceptance Criteria
1. **Feature Flag** – When `$RATE_LIMIT_ENABLED=true`, middleware activates; otherwise, it's a no-op.
2. **Configurable Limits** – Defaults: `60` requests/minute per IP; override via `$RATE_LIMIT_WINDOW_MS` and `$RATE_LIMIT_MAX`.
3. **Headers** – On limit breach, user receives HTTP 429 with `Retry-After` header.
4. **Logging** – Each 429 is logged (see Story 8) with `user.sub` & `ip`.
5. **Tests** – Integration test fires > limit requests and asserts 429.

## Technical Notes
* Store rate-limit hits in-memory for simplicity; evaluate Cloud Memorystore if multi-instance scaling exceeds free tier.
* Exempt `/healthz` and Cloud Run internal probes. 