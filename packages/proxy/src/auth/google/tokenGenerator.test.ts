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
  });

  describe('Development Environment (skipAuth: true)', () => {
    const devConfig: GoogleAuthConfig = {
      skipAuth: true,
      mockToken: 'dev-service-token'
    };

    it('should return mock token when skipAuth is true', async () => {
      const generator = new GoogleTokenGenerator(devConfig);
      const token = await generator.generateIdToken('test-audience');
      
      expect(token).toBe('dev-service-token');
      expect(mockGetIdTokenClient).not.toHaveBeenCalled();
    });

    it('should return default dev token when mockToken is not provided', async () => {
      const configWithoutMock: GoogleAuthConfig = {
        skipAuth: true
      };
      
      const generator = new GoogleTokenGenerator(configWithoutMock);
      const token = await generator.generateIdToken('test-audience');
      
      expect(token).toBe('dev-service-token');
    });
  });

  describe('Production Environment (skipAuth: false)', () => {
    const prodConfig: GoogleAuthConfig = {
      skipAuth: false,
      projectId: 'test-project',
      audience: 'test-audience'
    };

    it('should generate real Google ID token', async () => {
      const mockIdTokenProvider = {
        fetchIdToken: mockFetchIdToken.mockResolvedValue('real-google-token')
      };
      
      const mockClient = {
        idTokenProvider: mockIdTokenProvider
      };
      
      mockGetIdTokenClient.mockResolvedValue(mockClient);
      
      const generator = new GoogleTokenGenerator(prodConfig);
      const token = await generator.generateIdToken('test-audience');
      
      expect(token).toBe('real-google-token');
      expect(mockGetIdTokenClient).toHaveBeenCalledWith('test-audience');
      expect(mockFetchIdToken).toHaveBeenCalledWith('test-audience');
    });

    it('should reuse existing idTokenClient on subsequent calls', async () => {
      const mockIdTokenProvider = {
        fetchIdToken: mockFetchIdToken.mockResolvedValue('cached-token')
      };
      
      const mockClient = {
        idTokenProvider: mockIdTokenProvider
      };
      
      mockGetIdTokenClient.mockResolvedValue(mockClient);
      
      const generator = new GoogleTokenGenerator(prodConfig);
      
      // First call
      await generator.generateIdToken('test-audience');
      // Second call
      await generator.generateIdToken('test-audience');
      
      expect(mockGetIdTokenClient).toHaveBeenCalledTimes(1);
      expect(mockFetchIdToken).toHaveBeenCalledTimes(2);
    });

    it('should handle Google Auth initialization errors', async () => {
      mockGetIdTokenClient.mockRejectedValue(new Error('Google Auth failed'));
      
      const generator = new GoogleTokenGenerator(prodConfig);
      
      await expect(generator.generateIdToken('test-audience'))
        .rejects
        .toThrow(GoogleTokenGenerationError);
    });

    it('should handle token generation errors', async () => {
      const mockIdTokenProvider = {
        fetchIdToken: mockFetchIdToken.mockRejectedValue(new Error('Token fetch failed'))
      };
      
      const mockClient = {
        idTokenProvider: mockIdTokenProvider
      };
      
      mockGetIdTokenClient.mockResolvedValue(mockClient);
      
      const generator = new GoogleTokenGenerator(prodConfig);
      
      await expect(generator.generateIdToken('test-audience'))
        .rejects
        .toThrow(GoogleTokenGenerationError);
    });
  });

  describe('Error Handling', () => {
    it('should wrap Google Auth errors in GoogleTokenGenerationError', async () => {
      const prodConfig: GoogleAuthConfig = {
        skipAuth: false,
        projectId: 'test-project'
      };
      
      const originalError = new Error('Google service unavailable');
      mockGetIdTokenClient.mockRejectedValue(originalError);
      
      const generator = new GoogleTokenGenerator(prodConfig);
      
      try {
        await generator.generateIdToken('test-audience');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(GoogleTokenGenerationError);
        expect((error as GoogleTokenGenerationError).message).toContain('Google service unavailable');
        expect((error as GoogleTokenGenerationError).originalError).toBe(originalError);
      }
    });
  });
}); 