import '../../test-setup.js';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleTokenGenerator } from './tokenGenerator.js';
import { GoogleAuthConfig } from './types.js';
import { GoogleTokenGenerationError } from './errors.js';

// Mock the Google Auth library
const mockFetchIdToken = vi.fn();
const mockGetIdTokenClient = vi.fn();

vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getIdTokenClient: mockGetIdTokenClient
  }))
}));

describe('GoogleTokenGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIdTokenClient.mockResolvedValue({
      idTokenProvider: {
        fetchIdToken: mockFetchIdToken
      }
    });
  });

  describe('Development Mode (skipAuth: true)', () => {
    it('should return mock token when auth is skipped', async () => {
      const config: GoogleAuthConfig = {
        skipAuth: true,
        mockToken: 'test-mock-token'
      };
      
      const generator = new GoogleTokenGenerator(config);
      const result = await generator.generateIdToken('test-audience');
      
      expect(result).toBe('test-mock-token');
      expect(mockGetIdTokenClient).not.toHaveBeenCalled();
    });

    it('should return default mock token when none configured', async () => {
      const config: GoogleAuthConfig = {
        skipAuth: true
      };
      
      const generator = new GoogleTokenGenerator(config);
      const result = await generator.generateIdToken('test-audience');
      
      expect(result).toBe('dev-service-token');
      expect(mockGetIdTokenClient).not.toHaveBeenCalled();
    });

    it('should log development mode message', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const config: GoogleAuthConfig = {
        skipAuth: true
      };
      
      const generator = new GoogleTokenGenerator(config);
      await generator.generateIdToken('test-audience');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Auth] Development mode - skipping service token injection'
      );
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('Production Mode (skipAuth: false)', () => {
    it('should generate Google ID token successfully', async () => {
      const config: GoogleAuthConfig = {
        skipAuth: false,
        projectId: 'test-project',
        audience: 'test-audience'
      };
      
      mockFetchIdToken.mockResolvedValue('google-id-token-12345');
      
      const generator = new GoogleTokenGenerator(config);
      const result = await generator.generateIdToken('test-audience');
      
      expect(result).toBe('google-id-token-12345');
      expect(mockGetIdTokenClient).toHaveBeenCalledWith('test-audience');
      expect(mockFetchIdToken).toHaveBeenCalledWith('test-audience');
    });

    it('should log audience for debugging', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const config: GoogleAuthConfig = {
        skipAuth: false
      };
      
      mockFetchIdToken.mockResolvedValue('test-token');
      
      const generator = new GoogleTokenGenerator(config);
      await generator.generateIdToken('debug-audience');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Auth] Generating Google ID token with audience:', 'debug-audience'
      );
      
      consoleLogSpy.mockRestore();
    });

    it('should reuse ID token client for multiple calls', async () => {
      const config: GoogleAuthConfig = {
        skipAuth: false
      };
      
      mockFetchIdToken
        .mockResolvedValueOnce('token-1')
        .mockResolvedValueOnce('token-2');
      
      const generator = new GoogleTokenGenerator(config);
      
      // First call
      const result1 = await generator.generateIdToken('audience-1');
      expect(result1).toBe('token-1');
      
      // Second call should reuse client
      const result2 = await generator.generateIdToken('audience-2');
      expect(result2).toBe('token-2');
      
      // Should only create client once
      expect(mockGetIdTokenClient).toHaveBeenCalledTimes(1);
      expect(mockFetchIdToken).toHaveBeenCalledTimes(2);
    });

    it('should throw GoogleTokenGenerationError when client creation fails', async () => {
      const config: GoogleAuthConfig = {
        skipAuth: false
      };
      
      mockGetIdTokenClient.mockRejectedValue(new Error('Client creation failed'));
      
      const generator = new GoogleTokenGenerator(config);
      
      await expect(generator.generateIdToken('test-audience')).rejects.toThrow(
        GoogleTokenGenerationError
      );
    });

    it('should throw GoogleTokenGenerationError when token fetch fails', async () => {
      const config: GoogleAuthConfig = {
        skipAuth: false
      };
      
      mockFetchIdToken.mockRejectedValue(new Error('Token fetch failed'));
      
      const generator = new GoogleTokenGenerator(config);
      
      await expect(generator.generateIdToken('test-audience')).rejects.toThrow(
        GoogleTokenGenerationError
      );
    });

    it('should throw GoogleTokenGenerationError when auth not initialized', async () => {
      const config: GoogleAuthConfig = {
        skipAuth: false
      };
      
      // Force auth to be undefined by not initializing it
      const generator = new GoogleTokenGenerator(config);
      // Access private property to set it to undefined (for test)
      (generator as any).auth = undefined;
      
      await expect(generator.generateIdToken('test-audience')).rejects.toThrow(
        GoogleTokenGenerationError
      );
    });

    it('should handle error logging correctly', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const config: GoogleAuthConfig = {
        skipAuth: false
      };
      
      const testError = new Error('Test error');
      mockGetIdTokenClient.mockRejectedValue(testError);
      
      const generator = new GoogleTokenGenerator(config);
      
      await expect(generator.generateIdToken('test-audience')).rejects.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Google-Auth-ERR]',
        'Test error',
        testError
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
}); 