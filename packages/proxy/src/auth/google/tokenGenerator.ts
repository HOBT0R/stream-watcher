import { GoogleAuth } from 'google-auth-library';
import { GoogleAuthConfig } from './types.js';
import { GoogleTokenGenerationError } from './errors.js';
import winston from 'winston';

interface IdTokenProvider {
  fetchIdToken(audience: string): Promise<string>;
}

interface IdTokenClient {
  idTokenProvider: IdTokenProvider;
}

export class GoogleTokenGenerator {
  private auth?: GoogleAuth;
  private idTokenClient?: IdTokenClient;

  constructor(
    private config: GoogleAuthConfig,
    private logger?: winston.Logger
  ) {
    if (!config.skipAuth) {
      this.logger?.debug('Initializing Google Auth client', {
        event: 'google_auth_init',
        projectId: config.projectId
      });
      
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      
      this.logger?.debug('Google Auth client initialized', {
        event: 'google_auth_initialized'
      });
    }
  }

  async generateIdToken(audience: string, correlationId?: string): Promise<string> {
    if (this.config.skipAuth) {
      this.logger?.debug('Google token generation skipped - development mode', {
        event: 'google_token_generation_skipped',
        mockToken: this.config.mockToken || 'dev-service-token',
        correlationId
      });
      
      return this.config.mockToken || 'dev-service-token';
    }

    try {
      this.logger?.debug('Starting Google ID token generation', {
        event: 'google_token_generation_start',
        audience,
        correlationId
      });
      
      if (!this.idTokenClient) {
        if (!this.auth) {
          throw new GoogleTokenGenerationError('Google Auth client not initialized');
        }
        
        this.logger?.debug('Creating Google ID token client', {
          event: 'google_token_client_creating',
          audience,
          correlationId
        });
        
        this.idTokenClient = await this.auth.getIdTokenClient(audience);
        
        this.logger?.debug('Google ID token client created', {
          event: 'google_token_client_created',
          correlationId
        });
      }
      
      const idToken = await this.idTokenClient.idTokenProvider.fetchIdToken(audience);
      
      this.logger?.info('Google ID token generated successfully', {
        event: 'google_token_generation_success',
        audience,
        tokenPreview: idToken.substring(0, 20) + '...',
        correlationId
      });
      
      return idToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown token generation error';
      
      this.logger?.error('Google ID token generation failed', {
        event: 'google_token_generation_failed',
        audience,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: errorMessage
        },
        correlationId
      });
      
      throw new GoogleTokenGenerationError(errorMessage, error instanceof Error ? error : undefined);
    }
  }
} 