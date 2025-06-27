import { GoogleAuth } from 'google-auth-library';
import { GoogleAuthConfig } from './types.js';
import { GoogleTokenGenerationError } from './errors.js';

interface IdTokenProvider {
  fetchIdToken(audience: string): Promise<string>;
}

interface IdTokenClient {
  idTokenProvider: IdTokenProvider;
}

export class GoogleTokenGenerator {
  private auth?: GoogleAuth;
  private idTokenClient?: IdTokenClient;

  constructor(private config: GoogleAuthConfig) {
    if (!config.skipAuth) {
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    }
  }

  async generateIdToken(audience: string): Promise<string> {
    if (this.config.skipAuth) {
      console.log('[Auth] Development mode - skipping service token injection');
      return this.config.mockToken || 'dev-service-token';
    }

    try {
      // Debug: log the audience we are about to use when requesting a token
      console.log('[Auth] Generating Google ID token with audience:', audience);
      
      if (!this.idTokenClient) {
        if (!this.auth) {
          throw new GoogleTokenGenerationError('Google Auth client not initialized');
        }
        this.idTokenClient = await this.auth.getIdTokenClient(audience);
      }
      
      const idToken = await this.idTokenClient.idTokenProvider.fetchIdToken(audience);
      return idToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown token generation error';
      console.error('[Google-Auth-ERR]', errorMessage, error);
      throw new GoogleTokenGenerationError(errorMessage, error instanceof Error ? error : undefined);
    }
  }
} 