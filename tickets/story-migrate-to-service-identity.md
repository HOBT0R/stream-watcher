### **Story: Migrate BFF Authentication to Service Identity**

> **Status:** ✅ *Implemented in code – pending Cloud-Run IAM role assignment and BFF ingress update in GCP.*

**User Story:**
As a platform engineer, 

I want to replace the static API key authentication between the UI Proxy and the downstream BFF with Google-managed service-to-service authentication, 

so that we can improve security by eliminating long-lived secrets and follow Google Cloud best practices.

**Current State:**
The UI Proxy authenticates to the BFF service (`twitchservice`) by sending a static `BFF_API_KEY` in its requests. This key is stored in Google Secret Manager as `app-config` and injected into the proxy at runtime. While this works, it relies on a long-lived secret that could be compromised.

**Proposed Solution:**
Leverage Google Cloud's built-in service-to-service authentication mechanism to secure the connection between the UI Proxy and the BFF, as described in the [official documentation](https://cloud.google.com/run/docs/authenticating/service-to-service).

This involves the following steps:

1.  **Grant Identity to the UI Proxy:**
    *   Ensure the `stream-watcher-ui-proxy` Cloud Run service is running with a dedicated, non-default service account. This service account will represent its identity.

2.  **Modify the UI Proxy Code:**
    *   Update the code responsible for making requests to the BFF.
    *   Before making a request, the proxy should first query the local Google metadata server to fetch a Google-signed ID token.
    *   The request to the metadata server must specify the URL of the target service (`twitchservice`) as the `audience` for the token.
    *   The fetched ID token should then be attached to the outgoing request to the BFF as an `Authorization: Bearer <ID_TOKEN>` header.

    **Local Development & Docker Environments**
    *   For local and Docker-based development, authentication between the proxy and the BFF will be **disabled**. The proxy will not send any auth headers to the BFF.
    *   **User Authentication (end-user login)** will be handled as follows:
        *   **Local:** User authentication will be disabled (`SKIP_JWT_VERIFY=true`) for ease of development. No login screen will be present.
        *   **Docker:** User authentication will be **enabled** (`SKIP_JWT_VERIFY=false`) and will use the Firebase Auth Emulator, requiring developers to log in.

    **Technical Implementation Details:**
    To fetch the ID token, the proxy will make a GET request to the Google metadata server endpoint:

    ```javascript
/**
 * TODO(developer):
 *  1. Uncomment and replace these variables before running the sample.
 */
// const targetAudience = 'http://www.example.com';

const {GoogleAuth} = require('google-auth-library');

async function getIdTokenFromMetadataServer() {
  const googleAuth = new GoogleAuth();

  const client = await googleAuth.getIdTokenClient(targetAudience);

  // Get the ID token.
  // Once you've obtained the ID token, you can use it to make an authenticated call
  // to the target audience.
  await client.idTokenProvider.fetchIdToken(targetAudience);
  console.log('Generated ID token.');
}

getIdTokenFromMetadataServer();
    ```

    *   `AUDIENCE` must be replaced with the full URL of the `twitchservice` (the BFF).
      * this should be the same as the BFF URL
    *   The request must include the `Metadata-Flavor: Google` header.
    *   The response from the metadata server will be a JWT (the ID token), which the proxy will then use in the `Authorization` header for the downstream request.

3.  **Configure the BFF Service:**
    *   Modify the `twitchservice` Cloud Run service's ingress settings to require authentication **in production**. For local and Docker environments, no ingress authentication from the proxy will be required.
    *   Grant the UI Proxy's service account the "Cloud Run Invoker" role on the `twitchservice`. This will allow the BFF to validate that the incoming ID token belongs to an authorized caller.

**Benefits:**
*   **Enhanced Security:** Replaces a static, long-lived API key with automatically-rotated, short-lived, Google-signed credentials in production.
*   **Reduced Secret Management:** The `app-config` secret containing the `BFF_API_KEY` can be completely removed, simplifying our configuration.
*   **Best Practices:** Aligns our architecture with Google's recommended security model for service-to-service communication.

**Acceptance Criteria:**
*   The `BFF_API_KEY` and the `app-config` secret are completely removed and no longer used in any environment.
*   The UI Proxy successfully calls the BFF service using a Google-signed ID token for authentication in **production**.
*   The `twitchservice` is configured in **production** to only accept authenticated requests from the UI Proxy's service account.
*   The local development environment is fully functional without requiring user or service-level authentication.
*   The Docker development environment is fully functional, requiring user authentication (via the emulator) but no proxy-to-BFF authentication. 