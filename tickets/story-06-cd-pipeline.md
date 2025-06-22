Status: Obsolete
Date: 2024-06-21

---
# Story 6 – CD Pipeline (Cloud Run Deploy)

**This story is now obsolete.** The deployment steps have been merged into the main CI pipeline defined in `cloudbuild.yaml` as part of `story-05`, in order to maintain consistency with other projects.

---

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 0.5 developer-day

## Context
After the image is built and tested in CI, we must automatically deploy the latest revision to Cloud Run.

## Acceptance Criteria
1. **Workflow File** – `.github/workflows/cd.yml` (or extension of CI workflow) triggered on merge to `main` or manual dispatch.
2. **Deploy Step** – Runs:
   ```bash
   gcloud run deploy stream-watcher-ui-proxy \
     --image us-docker.pkg.dev/<gcp-project>/stream-watcher/ui-proxy:${{ github.sha }} \
     --region us-central1 --platform managed --quiet \
     --revision-suffix=${{ github.sha }}
   ```
3. **Secrets** – Uses the same GCP auth mechanism as CI (Workload Identity Federation or service-account key).
4. **Smoke Test** – After deploy, script calls `https://<cloud-run-domain>/healthz` and exits non-zero on failure.
5. **Rollback Guidance** – README section explains how to roll back to previous revision via `gcloud run services update-traffic`.

## Technical Notes
* Consider `google-github-actions/deploy-cloudrun@v1` to simplify deploy step.
* Use `concurrency` group in workflow to ensure only one deploy runs at a time. 