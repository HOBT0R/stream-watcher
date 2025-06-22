### **Bug Report: Production API Requests Fail with 401 Unauthorized**

**Summary:**
All authenticated API requests in the production environment were failing with a `401 Unauthorized` error.

> **Status:** ✅ *Fixed in commit <SHA>. `cloudbuild.yaml` now sets `JWT_JWKS_URI`.*

**Root Cause:**
Analysis of the production Cloud Run logs reveals a repeating error in the proxy service: `JWT Verification Error: JWKS URI not configured`.

This error occurs because the `JWT_JWKS_URI` environment variable is not being set during the production deployment. The `cloudbuild.yaml` file correctly sets `FIREBASE_PROJECT_ID`, `JWT_ISSUER`, and `JWT_AUDIENCE`, but the `JWT_JWKS_URI` is missing. Without this URI, the proxy's authentication middleware cannot fetch Google's public keys to validate user JWTs.

**Affected Components:**
*   **Deployment:** `cloudbuild.yaml`
*   **Runtime:** `packages/proxy/src/middleware/auth.ts`

**Steps to Reproduce:**
1.  Deploy the application to Cloud Run with the current `cloudbuild.yaml`.
2.  Log in to the deployed application.
3.  The UI will fail to load channel data, and browser network tools will show that requests to `/api/*` endpoints are returning a 401 status code.
4.  Inspect the logs for the `stream-watcher-ui-proxy` service in Google Cloud Logging to confirm the "JWKS URI not configured" error.

**Proposed Solution:**
Update the `gcloud run deploy` step in `cloudbuild.yaml` to include the `JWT_JWKS_URI` in the `--set-env-vars` block.

**File to Edit:** `cloudbuild.yaml`

**Required Change:**
```yaml
# ... inside the 'gcloud run deploy' args ...
      - '--set-env-vars'
      - >-
        FIREBASE_PROJECT_ID=$PROJECT_ID,
        JWT_ISSUER=https://securetoken.google.com/$PROJECT_ID,
        JWT_AUDIENCE=$PROJECT_ID,
        JWT_JWKS_URI=https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com
# ...
```
This change will ensure the running proxy container has all the necessary configuration to perform JWT validation correctly. 