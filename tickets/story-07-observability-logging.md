# Story 7 – Observability & Structured Logging

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 0.3 developer-day

## Context
Debugging in production requires visibility into request rates, latency, and errors. We'll emit structured logs and metrics compatible with Cloud Logging & Monitoring (free tier).

## Acceptance Criteria
1. **Access Logs** – Integrate `morgan` in JSON mode; logs include `method`, `url`, `status`, `responseTime`, and `user.sub` if available.
2. **Error Logs** – Central error-handling middleware serialises stack traces (masked in prod) and logs with level `error`.
3. **Cloud Logging** – Logs appear in GCP console under resource `cloud_run_revision` with label `service=stream-watcher-ui-proxy`.
4. **Custom Metrics** – Export `requests_total`, `requests_duration_ms` via OpenTelemetry or simple `prom-client` and expose at `/metrics` (internal-only) or emit as logs.
5. **Docs** – Confluence / README page shows how to query logs and set up alerts.

## Technical Notes
* Cloud Run autopopulates `trace` & `span` IDs if `X-Cloud-Trace-Context` header is propagated.
* Rate-limit sensitive paths from Story 9 should log `429` counts. 