Status: Done
Date: 2025-06-21

# Story 10: Implement Email/Password Auth with Google Identity Platform

**User Story:** As a developer, I want to use Google Identity Platform to manage a list of email/password users, so that the application can be secured without the overhead of a full OAuth integration or a single shared token.

---

## Acceptance Criteria

1.  **User Login:** A user can sign in via a simple email and password form in the UI. The user accounts will be pre-created by an administrator in the Google Cloud Console.
2.  **Token Forwarding:** After a successful login, the JWT ID Token issued by Google Identity Platform is automatically attached as a `Bearer` token to all subsequent API requests.
3.  **Proxy Verification:** The proxy server's `auth` middleware successfully validates the JWT using Google's public JWKS URI.
4.  **Configuration:** The proxy server is configured via environment variables for the JWKS URI, and the expected token `issuer` and `audience`.
5.  **Clean Code:** All previous authentication logic (self-signed JWTs) is removed.
6.  **Testing:** All proxy authentication tests mock the Google authentication flow and pass successfully.

---

## Technical Implementation Plan

This plan primarily impacts the front-end. The back-end proxy code is **already complete** and supports this approach.

### 1. Front-End (React App) Changes

*   **Add Firebase SDK:**
    *   Install the `firebase` package (`npm install firebase`).
    *   Create `src/firebase.ts` to initialize the Firebase app using credentials from environment variables (`VITE_FIREBASE_API_KEY`, etc.).

*   **Create Authentication Context:**
    *   Create `src/contexts/AuthContext.tsx`.
    *   This context will manage the user's auth state (`user`, `token`, `loading`) and provide `login(email, password)` and `logout` functions.
    *   The `login` function will call Firebase's `signInWithEmailAndPassword`. On success, it will store the user object and the ID token.

*   **Create Login UI:**
    *   Create a simple, full-page `LoginPage.tsx` component with form fields for email and password and a "Sign In" button.
    *   This page will be shown if the user is not authenticated. Upon successful login, the app should redirect to the main dashboard.

*   **Update App Entrypoint:**
    *   In `src/App.tsx`, wrap the application in the `AuthContext.Provider`.
    *   Implement protected routing logic that shows the `LoginPage` if there is no authenticated user, otherwise shows the `MainLayout`.

*   **Update API Client:**
    *   In `src/services/api/config.ts`, add an Axios request interceptor to `apiClient`.
    *   This interceptor will read the token from `AuthContext` and inject the `Authorization: Bearer <token>` header into every outgoing request.

### 2. Back-End (Proxy Server) Changes

*   **No new changes required.** The existing JWKS-based verification logic in the `auth` middleware correctly handles tokens issued by Google Identity Platform for any sign-in method.

---
*Reference: [Google Cloud Docs - Sign in a user with an email](https://cloud.google.com/identity-platform/docs/sign-in-user-email)* 