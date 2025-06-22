# Firebase Auth Emulator Package

This package contains the configuration and scripts to run the Firebase Authentication Emulator for local development and testing.

## Purpose

The Firebase Auth Emulator allows the frontend application to interact with a local version of Firebase Authentication services. This avoids the need to use a live Firebase project for development, making it easier and safer to test authentication flows.

## Usage

### Local Development

The emulator is automatically started when you run `npm run dev` from the root of the project.

You can also run the emulator standalone by navigating to this directory and running:

```bash
npm run dev
```

The emulator UI will be available at `http://localhost:4000`.

### Docker

This package includes a `Dockerfile` to build a containerized version of the auth emulator. The `docker-compose.yaml` file in the root of the project is configured to use this service.

When running with Docker, the emulator service is available to other containers at `http://auth-emulator:9099`. 