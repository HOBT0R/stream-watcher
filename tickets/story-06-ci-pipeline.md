# Story 5 – CI Pipeline

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 1 developer-day

## Context
A reliable CI pipeline ensures code quality and produces a deployable Docker image for every commit.

## Acceptance Criteria
1. **Workflow File** – `.github/workflows/ci.yml` triggers on PR and push to `main`.
2. **Setup** – Caches npm cache (`~/.npm/_cacache`) via `actions/cache` keyed by lockfile hash.
3. **Quality Gates** – Runs `npm run lint` and `npm test -- --coverage`; fails if coverage < 95%.
4. **Docker Build** – Builds image using the Dockerfile from Story 5 and tags with commit SHA.
5. **Artifact Registry Push** – Pushes image to `us-docker.pkg.dev/<gcp-project>/stream-watcher/ui-proxy:<sha>` using Workload Identity Federation or a service-account key secret.
6. **Image Provenance** – Generates SBOM via `cosign attest` or `docker sbom` and attaches to the image.
7. **Status Badges** – README shows CI status badge.
8. **GitHub → GCP Auth** – Repository secrets `GCP_WORKLOAD_ID_PROVIDER` and `GCP_SA_EMAIL` (or `GCP_SERVICE_ACCOUNT_KEY`) are created and the workflow successfully authenticates using them.

## Technical Notes
* Use `google-github-actions/setup-gcloud` to authenticate in the free tier.
* Pin Node LTS version in `actions/setup-node`.
* Create a GCP Workload-Identity-Federation provider that trusts `token.actions.githubusercontent.com` for this repo and grant the chosen service account the `Artifact Registry Writer` role.  Store the provider resource name and SA e-mail as GitHub secrets mentioned above.

## Workflow Steps (reference implementation)
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  build-test-publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write          # for Workload Identity Federation
    steps:
      - uses: actions/checkout@v4

      - name: Use Node LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ~/.npm/_cacache
          key: npm-${{ hashFiles('package-lock.json') }}

      - name: Install deps
        run: npm ci --legacy-peer-deps

      - name: Lint & Unit Tests
        run: |
          npm run lint
          npm test -- --coverage

      - name: Build Docker image
        run: |
          docker build -t ui-proxy:${{ github.sha }} .

      - name: Authenticate GCP
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_ID_PROVIDER }}
          service_account: ${{ secrets.GCP_SA_EMAIL }}

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker us-docker.pkg.dev --quiet

      - name: Push image
        run: |
          docker tag ui-proxy:${{ github.sha }} us-docker.pkg.dev/$PROJECT/stream-watcher/ui-proxy:${{ github.sha }}
          docker push us-docker.pkg.dev/$PROJECT/stream-watcher/ui-proxy:${{ github.sha }}

      - name: Generate SBOM
        run: docker sbom ui-proxy:${{ github.sha }} > sbom-${{ github.sha }}.spdx.json

      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom-${{ github.sha }}.spdx.json
```

> The job stops after pushing the image; deployment happens in the CD workflow (Story 6). 