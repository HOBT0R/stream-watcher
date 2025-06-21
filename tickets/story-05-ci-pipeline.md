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

---

## Appendix: Obtaining Front-End Credentials for CI/CD

The React front-end requires a set of credentials at **build time** to connect to Google Identity Platform. These keys are public and are safely embedded in the final JavaScript bundle. The CI pipeline will need access to these keys to build the UI before containerization.

Here is the definitive process for obtaining these keys, which is compatible with a **Cloud Run hosting environment**.

### Step 1: Register a "Web App" in Firebase to get Keys

Even though we are hosting the application on Cloud Run, we must register a "Web App" in the Firebase console. This step **does not** tie us to Firebase Hosting. Its only purpose is to generate the configuration object that the client-side Firebase SDK needs to identify our backend project.

1.  Navigate to the **Firebase Console** and select your project.
2.  In the Project Overview, click the **Web icon (`</>`)** to "Add an app".
3.  Enter an **App nickname** (e.g., "Stream Watcher UI").
4.  **Do not** check the box for "Set up Firebase Hosting". This is critical. We are only registering the client, not using Firebase's hosting product.
5.  Click **"Register app"**.

### Step 2: Retrieve the Configuration for Environment Variables

After registering, Firebase will display a `firebaseConfig` object. This contains the values needed for our front-end's `.env` file and the CI pipeline's secrets.

1.  From the `firebaseConfig` object, copy the values for:
    *   `apiKey`
    *   `authDomain`
    *   `projectId`
    *   `storageBucket`
    *   `messagingSenderId`
    *   `appId`

2.  **For Local Development:** These values should be placed in a `.env` file at the root of the monorepo, prefixed with `VITE_`. For example: `VITE_FIREBASE_API_KEY="AIzaSy..."`.

3.  **For the CI/CD Pipeline:** These same values must be added as **GitHub repository secrets**. The CI workflow (`.github/workflows/ci.yml`) will then use these secrets to create a temporary `.env` file for the `npm run build` step.

    *   Create repository secrets named `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.
    *   The build step in the CI workflow should be modified to include:
        ```yaml
        - name: Create .env file for UI build
          run: |
            echo VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }} >> .env
            echo VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }} >> .env
            # ... and so on for all required keys
        ``` 