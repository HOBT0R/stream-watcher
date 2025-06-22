# Story 5 – CI Pipeline with Google Cloud Build

**Epic:** Node Server Proxy & CI/CD Integration  
**Estimate:** 1 developer-day

## Context
To maintain consistency with other projects in the ecosystem, we will use Google Cloud Build for our Continuous Integration pipeline. This pipeline will be responsible for running quality checks, building a production-ready Docker image, and pushing it to Google Artifact Registry.

## Acceptance Criteria
1.  **Workflow File** – A `cloudbuild.yaml` file exists in the project root.
2.  **Quality Gates** – The build runs `npm run lint` and `npm test`. The build must fail if any tests or linting checks fail.
3.  **Docker Build** – On success, the pipeline builds the root `Dockerfile` and tags the resulting image as `us-central1-docker.pkg.dev/$PROJECT_ID/stream-watcher/ui-proxy:$SHORT_SHA`.
4.  **Artifact Registry Push** – The tagged image is pushed to Google Artifact Registry.
5.  **Trigger** – A Cloud Build trigger is configured to automatically run the pipeline on every push to the `main` branch.

## Technical Implementation

The `cloudbuild.yaml` will consist of the following steps, executed in order:

1.  **Install Dependencies**: Run `npm install` to prepare the environment for testing and linting.
2.  **Lint**: Run `npm run lint` to check for code quality issues.
3.  **Test**: Run `npm run test` to execute the automated test suite.
4.  **Build Docker Image**: Use the standard Docker builder to execute `docker build` using the `Dockerfile` in the root. The UI's build-time environment variables will be sourced from the `ui.env.docker` file.
5.  **Push Docker Image**: Push the newly created image to the specified Google Artifact Registry path.

### Example `cloudbuild.yaml` Structure

```yaml
steps:
  # 1. Install all dependencies
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install', '--legacy-peer-deps']

  # 2. Run linter
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'lint']

  # 3. Run unit tests
  - name: 'gcr.io/cloud-builders/npm'
    args: ['test']

  # 4. Build the Docker image, sourcing UI build args from ui.env.docker
  # Note: cloudbuild automatically has access to the files in the repo
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--tag'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/stream-watcher/ui-proxy:$SHORT_SHA'
      - '.'

  # 5. Push the image to Google Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/stream-watcher/ui-proxy:$SHORT_SHA'

# Store the final image in the build results
images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/stream-watcher/ui-proxy:$SHORT_SHA'

options:
  logging: CLOUD_LOGGING_ONLY
```

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