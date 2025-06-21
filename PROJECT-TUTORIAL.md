# Manual Test Plan: Stream Watcher

This document provides instructions for a new developer to set up and manually test the Stream Watcher application.

## 1. Prerequisites

Before you begin, ensure you have the following software installed:

*   **Git**: For cloning the repository.
*   **Node.js**: `v20.x` or higher.
*   **npm**: `v9.x` or higher.
*   **Docker** & **Docker Compose**: For running the containerized environment.

## 2. Initial Setup

First, clone the repository and install all the necessary dependencies.

```bash
# 1. Clone the repository
git clone <repository-url>
cd stream-watcher

# 2. Install all dependencies from the root directory
npm install
```

## 3. Environment Configuration

This project uses dedicated env-files for local **and** Docker workflows.

| Purpose | File | Scope |
|---------|------|-------|
| Local UI build/runtime | `.env` | read by Vite when you run `npm run dev` |
| Local proxy runtime | `packages/proxy/.env` | read by the proxy when you run `npm run dev` |
| Docker UI build | `ui.env.docker` | injected at build-time into the UI stage |
| Docker proxy runtime | `packages/proxy/proxy.env.docker` | consumed at runtime by the proxy container |

### A. For **Local Development** (`npm run dev`)

For local development, the environment bypasses authentication entirely (`VITE_SKIP_LOGIN=true` and `SKIP_JWT_VERIFY=true`).  No Firebase Auth emulator or login steps are required.

You will need two separate `.env` files: one for the frontend UI in the project root, and one for the proxy service in its package directory.

**Action 1: Create the Root `.env` File for the UI**

This file provides variables to the Vite build process for the frontend. Create a file named `.env` in the **project root** with the following content:

```env
# =================================================
# .env file for LOCAL UI (in project root)
# =================================================
VITE_USE_AUTH_EMULATOR=false
VITE_FIREBASE_EMULATOR_HOST=
VITE_FIREBASE_PROJECT_ID=stream-watcher-dev
VITE_SKIP_LOGIN=true
VITE_FIREBASE_API_KEY=fake-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_STORAGE_BUCKET=stream-watcher-dev.appspot.com
```

**Action 2: Create the Proxy's `.env` File**

This file provides variables for the Node.js proxy server. The default configuration disables JWT verification.

1.  Navigate to the `packages/proxy` directory.
2.  Create a file named `.env` by copying the local example: `cp example.env .env`.
3.  The `dev` script for the proxy will automatically load this file. The default values are correct for local development.

### B. For **Docker Development** (`docker compose up`)

For Docker development, you now need **two** Docker-specific files (one for the UI build, one for the proxy). The Firebase auth-emulator continues to read its own `.env.docker` in `packages/auth-emulator`.

**Action 1: Create `ui.env.docker` (UI build)**

1.  Navigate to the project root.
2.  Create `ui.env.docker` by copying the template: `cp example.ui.env.docker ui.env.docker`.

**Action 2: Create `proxy.env.docker` (proxy runtime)**

1.  Navigate to `packages/proxy`.
2.  Create the file via: `cp example.proxy.env.docker proxy.env.docker`.

`docker-compose.yaml` is wired to read **both** `ui.env.docker` (build stage) and `packages/proxy/proxy.env.docker` (runtime stage).

## 4. Testing the Local Development Environment

This workflow uses Vite's hot-reloading server for the frontend and `ts-node` for the proxy.  The proxy skips JWT verification and the UI skips the login page so you can focus on feature work without setting up auth.

> **Prerequisite:** Make sure the Backend-for-Frontend (BFF) service is running and listening on **http://localhost:3000** before you start the UI/proxy stack.  The proxy forwards every `/api/*` request to that address.

1.  **Start the Services**:
    Run the following command from the project root:
    ```bash
    npm run dev
    ```
    This concurrently starts the UI, the proxy, and the Firebase Auth emulator.

2.  **Open the UI**:
    * After `npm run dev` finishes starting you can browse to **`http://localhost:5173`**.
    * The app will load directly into the main dashboard (no login).
    * **Expected Result**: Channel actions succeed—API calls are proxied through **localhost:8080** and reach the BFF at **localhost:3000**.

3.  **Perform Basic UI Tests**:
    *   Verify you can switch between light and dark modes.
    *   Navigate to the "Configuration" tab and add, edit, or delete a channel.
    *   Navigate back to the "Dashboard" and verify your changes.
    *   Click the **Logout** button.
    *   **Expected Result**: You should be returned to the login page.

## 5. Testing the Docker Environment

This workflow tests the fully containerized application.

1.  **Start the Services**:
    Run the following command from the project root.
    ```bash
    docker-compose --env-file .env.docker up --build
    ```
    > **Note:** The `--env-file .env.docker` flag is necessary here because it provides build-time variables to the frontend service, which are different from the runtime variables used by the other services.

    This will build the images for all services and start them.

2.  **Create a Test User**:
    *   Open your browser and navigate to the Firebase Emulator UI: **`http://localhost:4000`**.
    *   Click on the **Authentication** tab.
    *   Click **"Add user"** and create a new user (e.g., email: `test@example.com`, password: `password`).

3.  **Perform End-to-End Test**:
    *   Open a new browser tab and navigate to the Stream Watcher UI: **`http://localhost:8080`**.
    *   You should be presented with a login page.
    *   Log in using the credentials you created in the emulator.
    *   **Expected Result**: You should be redirected to the main dashboard. All subsequent API calls to the proxy should succeed.

4.  **Perform Basic UI Tests**:
    *   Verify you can switch between light and dark modes.
    *   Navigate to the "Configuration" tab and add, edit, or delete a channel.
    *   Navigate back to the "Dashboard" and verify your changes.
    *   Click the **Logout** button.
    *   **Expected Result**: You should be returned to the login page. 