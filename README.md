# Stream Watcher

A React-based frontend application for monitoring Twitch channel statuses. This application provides a clean, intuitive interface for tracking multiple Twitch channels, their live status, and managing stream keys.

## Features
- Real-time monitoring of Twitch channel status
- Dark and Light mode support with system preference detection
- Channel grouping and management through the UI
- Import/Export of channel configurations
- Filtering by online/offline status, role, and text search
- Inline video player to watch live streams directly from the dashboard
- Built with React, TypeScript, and Material-UI

### Inline Video Player

- Each channel card now includes a Play button (visible when the channel is live).
- Clicking Play expands the card to reveal an embedded Twitch player (16:9 aspect ratio, min 400x300px).
- You can play up to 4 streams at once; starting a fifth will require stopping another.
- The video player is only loaded when the card is visible in the viewport, improving performance.

## Prerequisites
- Node.js 20.x or higher
- npm 9.x or higher
- Docker & Docker Compose

## Quick Start

There are two ways to run the application: **locally with Node.js** for development, or as a fully **containerized application with Docker**.

### Running Locally with Node.js

This method is ideal for front-end or proxy development, as it uses Vite's hot-reloading server. This setup bypasses authentication, allowing you to work on features without needing to log in.

**1. Configure Environment**

You will need two separate `.env` files: one for the UI and one for the proxy.

*   **UI Environment:** Create a file named `.env` in the **project root** with the following content. This configures the UI to skip the login page.
    ```env
    VITE_USE_AUTH_EMULATOR=false
    VITE_FIREBASE_EMULATOR_HOST=
    VITE_FIREBASE_PROJECT_ID=stream-watcher-dev
    VITE_SKIP_LOGIN=true
    VITE_FIREBASE_API_KEY=fake-api-key
    VITE_FIREBASE_AUTH_DOMAIN=localhost
    VITE_FIREBASE_STORAGE_BUCKET=stream-watcher-dev.appspot.com
    ```

*   **Proxy Environment:** Create a `.env` file for the proxy service. The default configuration skips JWT verification.
    ```bash
    # Navigate to the proxy directory
    cd packages/proxy

    # Copy the example environment file
    cp example.env .env

    # Return to the root
    cd ../..
    ```

**2. Install Dependencies**
```bash
npm install
```

**3. Start Development Servers**

> **Note**: Before starting, ensure your back-end-for-frontend (BFF) service is running and accessible, as the proxy will forward all `/api/*` requests to it, based on the `BFF_BASE_URL` in `packages/proxy/.env`.

```bash
npm run dev
```
This command concurrently starts the React UI (on port 5173), the Node.js proxy (on port 8080), and the Firebase Auth emulator. You can access the UI at `http://localhost:5173`.

### Running with Docker

This method runs the entire application stack in containers, including the UI, the proxy, and the Firebase Auth emulator for a production-like test environment.

**1. Configure Environment**

The Docker setup requires two dedicated environment files.

*   **UI Build Environment:** From the project root, create `ui.env.docker` by copying the example:
    ```bash
    cp example.ui.env.docker ui.env.docker
    ```
*   **Proxy Runtime Environment:** In the `packages/proxy` directory, create `proxy.env.docker`:
    ```bash
    cp packages/proxy/example.proxy.env.docker packages/proxy/proxy.env.docker
    ```

**2. Build and Start Containers**
```bash
# Build the images and start the services in the background
docker compose up --build -d
```
Once started, the application will be accessible at `http://localhost:8080`.

**3. Create a Test User (First Time Only)**

The Docker environment uses the Firebase Auth Emulator for login.
*   Navigate to the Emulator UI at **`http://localhost:4000`**.
*   Click on the **Authentication** tab and click **"Add user"**.
*   Create a user (e.g., `test@example.com` / `password`).
*   You can now use these credentials to log in to the application at `http://localhost:8080`.

## Architecture Overview

This application consists of a React front-end and a Node.js proxy server that manages all API traffic. This design enhances security by ensuring the front-end never directly communicates with the back-end services. The proxy is responsible for authentication, logging, and routing requests.

```
┌──────────────────┐        ┌────────────┐        ┌────────────┐
│   Browser (UI)   │  HTTPS │  Node App  │  HTTPS │    BFF     │
└──────────────────┘  --->  └────────────┘  --->  └────────────┘
```

### Core Concepts

**Front-End:**
- **State Management**:
    - **`useLocalStorage`**: A custom hook that persists state to the browser's local storage, used for channel configurations and theme preferences.
    - **`useChannelManagement`**: A hook that centralizes all logic for managing channels (add, update, delete, import, export).
    - **`useChannelStatus`**: A hook responsible for polling the backend to get the online/offline status of channels.
    - **`useVideo`**: A hook and context that manages which channels are currently playing video, enforcing a concurrency limit and providing actions to start/stop playback.

- **Contexts**:
    - **`ThemeContext`**: Provides theme-related state (`isDarkMode`) and functions (`toggleTheme`) to the entire application. It also detects the user's system preference for dark mode.
    - **`ChannelContext`**: A comprehensive context that manages all channel-related state. It integrates `useChannelManagement` and `useChannelStatus` to provide a single source of truth for channel data, statuses, and management functions.
    - **`ChannelEditContext`**: Manages the state of the channel editing dialog, such as which channel is being edited and whether the dialog is open.
    - **`ChannelFilterContext`**: Manages the global filter state for the channel dashboard, including search text and role filters.

**Back-End (Proxy):**

The Node.js proxy server, located in `packages/proxy`, is a critical component that sits between the React UI and the back-end-for-frontend (BFF) service.

-   **Authentication:** It secures the application by verifying JSON Web Tokens (JWTs) on all incoming API requests using the `jose` library. For local development, it can be configured to bypass JWT verification for easier testing.
-   **Request Proxying:** It uses `http-proxy-middleware` to transparently forward all valid API requests to the appropriate back-end service, abstracting the back-end topology from the UI.
-   **Configuration:** The proxy is configured through environment variables, with support for `.env` files for local development. This includes settings for the BFF's URL, port, and authentication keys.

### Project Structure
```
stream-watcher/
|-- packages/
|   |-- proxy/
|       |-- src/
|           |-- middleware/
|           |-- ...
|-- src/
    |-- assets/
    |-- components/
    |   |-- MainLayout/
    |   |   |-- components/
    |   |   |   |-- ChannelConfiguration/
    |   |   |   |-- ChannelDashboard/
    |   |   |       |-- components/
    |   |   |           |-- ChannelGroup/
    |   |   |               |-- components/
    |   |   |                   |-- ChannelCard/
    |   |   |                   |   |-- components/
    |   |   |                   |-- ChannelList/
    |   |   |-- TopBar/
    |   |       |-- components/
    |   |           |-- ThemeToggle/
    |   |-- NavButton/
    |-- config/
    |-- constants/
    |-- contexts/
    |-- hooks/
    |-- services/
    |   |-- api/
    |-- types/
    |-- utils/

```

### Component Breakdown

-   **`App.tsx`**: The root component, responsible for setting up all the context providers (`ThemeProvider`, `ChannelProvider`, `ChannelEditProvider`, `ChannelFilterProvider`).
-   **`MainLayout.tsx`**: The primary layout component that organizes the `TopBar` and the main content area, switching between the `ChannelDashboard` and `ChannelConfiguration` views based on the active tab.
-   **`TopBar.tsx`**: The application's header, containing navigation buttons and the `ThemeToggle` component.
-   **`ChannelDashboard`**: The main view for displaying channel statuses. It acts as a controller for filtering, updating the `ChannelFilterContext`, and renders the channel groups.
-   **`ChannelConfiguration`**: The view for managing channels. It uses the `useChannels` and `useChannelEdit` hooks to interact with the channel list and open the edit dialog.
-   **`ChannelGroup`**: A component that renders a group of channels. It consumes both `ChannelContext` and `ChannelFilterContext` to display only the channels that match the current filter settings.
-   **`ChannelCard`**: A card that displays the status of a single channel. It includes actions to copy the channel name, get a stream key, open the channel on Twitch, and a play button to watch the live stream directly in the card. The video player is only mounted when the card is visible and actively playing.
-   **`ThemeToggle`**: A simple switch component for toggling between light and dark modes.

## 🔐  Authentication overview (updated)

The UI → Proxy → BFF flow now uses Google-managed identities.

| Environment | User Auth | Proxy → BFF Auth |
|-------------|-----------|-------------------|
| Local       | Disabled  | None              |
| Docker      | Firebase Auth **emulator** | None |
| Production  | Firebase Auth | Google-signed **ID token** (service-to-service) |

Key environment variables:

* `SKIP_JWT_VERIFY` – set to `true` to disable user-JWT verification (local).
* `JWT_JWKS_URI` – public-key endpoint used in production (set automatically in Cloud Build).
* `BFF_BASE_URL` – target BFF URL, no longer needs an API key.

`BFF_API_KEY` has been **removed** from all runtime paths.

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Environment Configuration

The application's configuration is managed differently for the **UI (Frontend)** and the **Proxy (Backend)**, based on when and how the variables are needed.

### Configuration Strategy: Build-Time vs. Run-Time

A key concept is the difference between variables needed at **build-time** versus **run-time**.

*   **Build-Time (UI):** These variables (prefixed with `VITE_`) are used only during the `npm run build` process to generate the static JavaScript files. Their values are embedded directly into the UI code. In production, these are supplied by the `FIREBASE_BUILD_ENV` secret.

*   **Run-Time (Proxy):** These variables are read by the Node.js server *after* it has been deployed and is running. They are not baked into the code. In production, these are supplied by the Cloud Run environment itself (via `--set-env-vars` and `--set-secrets` in `cloudbuild.yaml`).

This is why a variable like the Firebase Project ID appears in two forms: `VITE_FIREBASE_PROJECT_ID` for the UI build, and `FIREBASE_PROJECT_ID` for the proxy's runtime.

### UI (Vite Frontend) - Build-Time Configuration

The UI configuration is primarily concerned with connecting to Firebase services, either real or emulated.

| Variable | Local (`.env`) | Docker (`ui.env.docker`) | Production (Cloud Build) |
|---|---|---|---|
| `VITE_USE_AUTH_EMULATOR` | **Required.** Set to `true` to use the local Firebase Emulator. | **Required.** Set to `true` to connect to the `auth-emulator` service. | Not applicable. |
| `VITE_SKIP_LOGIN` | Optional. Set to `true` to bypass the login page for rapid UI development. | Not typically used. | Not applicable. |
| `VITE_FIREBASE_EMULATOR_HOST` | **Required** (if emulator is `true`). URL of the local auth emulator (e.g., `127.0.0.1:9099`). | **Required.** Set to `auth-emulator:9099` to connect to the Docker service. | Not applicable. |
| `VITE_FIREBASE_PROJECT_ID` | **Required.** Defines the Firebase project ID. | Sourced from `Dockerfile` fallback. Not set in `ui.env.docker`. | **Required.** Sourced from `FIREBASE_BUILD_ENV` secret. |
| `VITE_FIREBASE_API_KEY` | **Required.** Defines the Firebase API Key. | Sourced from `Dockerfile` fallback. Not set in `ui.env.docker`. | **Required.** Sourced from `FIREBASE_BUILD_ENV` secret. |
| `VITE_FIREBASE_AUTH_DOMAIN`| **Required.** Defines the Firebase Auth Domain. | Sourced from `Dockerfile` fallback. Not set in `ui.env.docker`. | **Required.** Sourced from `FIREBASE_BUILD_ENV` secret. |
| `VITE_FIREBASE_STORAGE_BUCKET`| **Required.** Defines the Firebase Storage Bucket. | Sourced from `Dockerfile` fallback. Not set in `ui.env.docker`. | **Required.** Sourced from `FIREBASE_BUILD_ENV` secret. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| **Required.** Defines the Firebase Messaging Sender ID. | Sourced from `Dockerfile` fallback. Not set in `ui.env.docker`. | **Required.** Sourced from `FIREBASE_BUILD_ENV` secret. |
| `VITE_FIREBASE_APP_ID`| **Required.** Defines the Firebase App ID. | Sourced from `Dockerfile` fallback. Not set in `ui.env.docker`. | **Required.** Sourced from `FIREBASE_BUILD_ENV` secret. |

### Proxy (Node.js Backend) - Run-Time Configuration

The proxy configuration manages server behavior, authentication, and connection to the downstream BFF service. These variables are read from the environment when the server starts.

| Variable | Local (`.env`) | Docker (`proxy.env.docker`) | Production (Cloud Run) |
|---|---|---|---|
| `PORT` | Optional. Defaults to `8080`. | Optional. Defaults to `8080`. | **Required.** Set by the Cloud Run environment to `8080`. |
| `BFF_TARGET_URL` | Optional. The URL of the downstream BFF service. Defaults to `http://localhost:3001`. | **Required.** Defines the URL for the BFF service. | **Required.** Injected from the `cloudRunUrl` property of the `APP_CONFIG_JSON` secret. |
| `BFF_AUDIENCE` | Optional. The audience for the ID token. Defaults to the `BFF_TARGET_URL`. | **Required.** The audience for the ID token. | **Required.** Injected from the `cloudRunUrl` property of the `APP_CONFIG_JSON` secret. |
| `SKIP_JWT_VERIFY` | Optional. Set to `true` to disable auth checks. | Optional. Set to `true` to disable auth checks. | Not used. Defaults to `false` (verification is always enabled). |
| `JWT_JWKS_URI` | **Required** (if JWT verification is enabled). | **Required** (if JWT verification is enabled). | **Required.** Sourced from the `cloudbuild.yaml` deployment step. |
| `JWT_ISSUER` | **Required** (if JWT verification is enabled). | **Required** (if JWT verification is enabled). | **Required.** Sourced from the `cloudbuild.yaml` deployment step. |
| `JWT_AUDIENCE` | **Required** (if JWT verification is enabled). | **Required** (if JWT verification is enabled). | **Required.** Sourced from the `cloudbuild.yaml` deployment step. |
| `FIREBASE_PROJECT_ID` | **Required** (if JWT verification is enabled). | **Required** (if JWT verification is enabled). | **Required.** Sourced from the `cloudbuild.yaml` deployment step. |

## Configuration

### Proxy Server (Back-End)

To run the proxy server locally, you'll need to configure its environment.

1.  Navigate to the `packages/proxy` directory.
2.  Copy the example environment file: `cp example.env .env`.
3.  Edit the `.env` file to set the required variables:
    *   `BFF_BASE_URL`: The URL of the back-end-for-frontend service (e.g., `http://localhost:3001`).
    *   `SKIP_JWT_VERIFY`: Set to `true` to bypass JWT verification for local development, allowing you to test API endpoints without a valid token. When `false` or unset, the proxy will require a valid JWT.

### Default Channels (Front-End)
The application comes with a set of default channels that are used when no configuration has been saved. You can modify these defaults by editing the `src/config/defaults.json` file:

```json
{
    "channels": {
        "ndzjdbyygfuljodpgarp0ehqw": {
            "channelName": "ndzjdbyygfuljodpgarp0ehqw",
            "displayName": "Speedromizer Dummy Channel 1",
            "group": "A",
            "description": "Runner A1",
            "isActive": true,
            "role": "runner"
        }
    },
    "preferences": {
        "viewMode": "grid",
        "pollInterval": 60,
        "showOffline": true
    }
}
```

Each channel configuration requires:
- `channelName`: The Twitch channel name (used as the unique identifier)
- `displayName`: Optional display name (defaults to channelName if not provided)
- `group`: The group this channel belongs to
- `description`: Optional description of the channel
- `isActive`: Whether to actively monitor this channel

The preferences section configures:
- `viewMode`: Display mode ("grid" or "list")
- `pollInterval`: How often to check channel status (in seconds)
- `showOffline`: Whether to show offline channels

Note: These defaults are only used when no configuration has been saved in the browser's localStorage. Once a user makes changes through the UI, their configuration will be saved and used instead of these defaults.


### Managing Channels

The Stream Watcher application allows you to manage your monitored channels directly through the UI on the "Configuration" tab. Here's how to use its features:

*   **Add a New Channel:**
    1.  Navigate to the "Configuration" tab.
    2.  Click the "Add Channel" button.
    3.  A dialog will appear where you can enter the `Channel Name` (Twitch ID), an optional `Display Name`, select or add a `Group`, provide an optional `Description`, and assign a `Role`.
    4.  Click "Save" to add the channel.

*   **Edit an Existing Channel:**
    1.  Navigate to the "Configuration" tab.
    2.  Locate the channel you wish to edit in the list.
    3.  Click the "Edit" (pencil) icon next to the channel.
    4.  A dialog will appear pre-filled with the channel's current information. You can modify the `Display Name`, `Group`, `Description`, `Role`, and `Active` status. The `Channel Name` cannot be changed.
    5.  Click "Save" to apply your changes.

*   **Delete a Channel:**
    1.  Navigate to the "Configuration" tab.
    2.  Locate the channel you wish to delete in the list.
    3.  Click the "Delete" (trash can) icon next to the channel.
    4.  Confirm the deletion if prompted.

*   **Import Channels:**
    1.  Navigate to the "Configuration" tab.
    2.  Click the "Import" button.
    3.  Select a `.json` file from your computer. The file should be an array of channel objects, or an object with a top-level key, `"channels"`, which holds an array or object of channel configuration objects.
    4.  The imported channels will be added to your current channel list.

*   **Export Channels:**
    1.  Navigate to the "Configuration" tab.
    2.  Click the "Export" button.
    3.  A `.json` file named `channels-<timestamp>.json` containing your current channel list will be downloaded to your computer.

## Brand Color Palette

### Speedromizer Darkmode
Inspired by the neon slot reel image.
*   Primary Color: Electric Purple — `#A100FF`
    Sets the retro-futuristic, arcade tone.
*   Secondary Color: Neon Yellow — `#FFD700`
    Used for glowing highlights and attention-drawing text.
*   Accent Color: Neon Green — `#00FF66`
    Adds motion and energy with directional cues.

### Speedromizer Lightmode
Inspired by the cartoon-style slot machine.
*   Primary Color: Candy Apple Red — `#D32F2F`
    Dominates the design and gives a bold, inviting feel.
*   Secondary Color: Burnt Orange — `#FF6F00`
    Provides contrast and enhances the game-show vibe.
*   Accent Color: Lime Green — `#00C853`
    Adds freshness and helps signal interactivity.

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future features
- Support HTTPS
- Add user roles (volunteers, staff)
- Make the stream polling interval configurable
- Add "edit" button to cards to allow quick changes to the details

## License
This project is licensed under the MIT License - see the LICENSE file for details.
