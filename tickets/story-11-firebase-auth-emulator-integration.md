Status: Planned
Date: 2025-06-20

---

# Story: Integrate Firebase Auth Emulator for Front-End Login Flows

Enable the React UI to exercise full Firebase Authentication flows (email+password, Google, phone/SMS) in **Local** and **Docker** profiles without contacting live Google services.

## Acceptance Criteria
1. The `packages/auth-emulator/firebase.json` includes an **Authentication emulator** section (`port 9099`).
2. `npm run dev` (local profile) spins up the emulator automatically via `firebase emulators:start --only auth` (concurrently with Vite + proxy).
3. UI code detects the `LOCAL_AUTH_EMULATOR` env flag and executes `connectAuthEmulator(getAuth(), "http://localhost:9099");`.
4. Test script demonstrates end-to-end sign-in:
   • Creates user with REST call to emulator.
   • Signs in via UI.
   • Proxy call passes with `SKIP_JWT_VERIFY=true` (local) or via simulator token (docker).
5. Documentation added to `README.md` (root) explaining how to:
   • Start the emulator manually.
   • Add test users through the Emulator Suite UI.
   • Use REST API to create users/headless tests.
6. Docker-compose stack has optional service `firebase-auth` that runs the emulator (use image `gcr.io/firebase-emulator/auth` or `node:20-alpine` + CLI). Listening on `9099`, network-aliased `auth-emulator`.
7. Environment template `example.env.docker` exposes `FIREBASE_EMULATOR_HOST=auth-emulator:9099` so the UI container auto-connects.
8. CI job `test:frontend` runs with the emulator in the background.

## Tasks
- [ ] Add dev-dependency `firebase-tools` to workspace root.
- [ ] Create `firebase.json` & `.firebaserc` configured for demo project `stream-watcher-dev`.
- [ ] Update `package.json` scripts: `emulators:auth`, `dev` (concurrently vite, proxy, auth).
- [ ] Modify `src/firebase.ts` to read `VITE_USE_AUTH_EMULATOR` and call `connectAuthEmulator`.
- [ ] Add `.env.local` key `VITE_USE_AUTH_EMULATOR=true`.
- [ ] Extend `docker-compose.yaml` with `auth-emulator` service.
- [ ] Write markdown section under `/docs/auth-emulator.md`.
- [ ] Add setup section to root `README.md` explaining how to launch the `auth-emulator` locally and in docker-compose, and how the UI auto-connects.
- [ ] Create `deploy-auth-emulator.sh` (mirrors `deploy.sh`) to build & start the emulator container on a Raspberry Pi for integration testing.

## Definition of Done
- Local `npm run dev` shows emulator UI at <http://localhost:4000> and login flows succeed.
- Docker compose `up` brings up `auth-emulator`; UI connects; manual login works.
- CI tests are green.

**Epic:** Auth & Local Environments
**Estimate:** 0.5 dev-day

### Prod-Safety / Separation
- [ ] Keep `firebase-tools` as **devDependency** only; prod Dockerfile installs `--omit=dev`.
- [ ] Ensure `npm run build:ui` and prod CI pipelines NEVER invoke `firebase emulators:start`.
- [ ] Wrap `connectAuthEmulator` call so it only executes when `import.meta.env.PROD === false` **and** `VITE_USE_AUTH_EMULATOR` is `true`.
- [ ] Docker/Helm manifests for production must not reference the `auth-emulator` service.
- [ ] Add CI guard that fails if `auth-emulator` container appears in prod deployment template (`grep auth-emulator k8s/prod/*.yaml && exit 1`).
- [ ] Document the dev-only nature of the emulator in `/docs/auth-emulator.md` and root README.

--- 