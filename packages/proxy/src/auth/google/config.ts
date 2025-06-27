import { GoogleAuthConfig } from './types.js';

export function getGoogleAuthConfig(): GoogleAuthConfig {
  const environment = process.env.NODE_ENV || 'development';
  
  // Environment-specific Google configuration
  switch (environment) {
    case 'production':
    case 'staging':
      return {
        skipAuth: false,
        projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
        audience: process.env.BFF_AUDIENCE || ''
      };
      
    case 'development':
    case 'test':
    default:
      return {
        skipAuth: true,
        mockToken: 'dev-service-token'
      };
  }
} 