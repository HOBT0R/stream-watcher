import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient } from './config';

// Define the mock server
const server = setupServer();

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

describe('apiClient interceptors', () => {

  describe('response interceptor error handling', () => {

    it('should handle 400 Bad Request errors', async () => {
      server.use(
        http.get('/test-400', () => {
          return HttpResponse.json({ error: 'Bad Data' }, { status: 400 });
        })
      );

      await expect(apiClient.get('/test-400')).rejects.toEqual({
        message: 'Invalid request',
        details: { error: 'Bad Data' }
      });
    });

    it('should handle 403 Forbidden errors', async () => {
      server.use(
        http.get('/test-403', () => {
          return HttpResponse.json({ error: 'Not Allowed' }, { status: 403 });
        })
      );

      await expect(apiClient.get('/test-403')).rejects.toEqual({
        message: 'Access forbidden',
        details: { error: 'Not Allowed' }
      });
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('/test-network-error', () => {
          return HttpResponse.error();
        })
      );

      // The 'details' will contain the original Axios error object
      await expect(apiClient.get('/test-network-error')).rejects.toMatchObject({
        message: 'Network error',
      });
    });

    it('should handle other unexpected errors', async () => {
        server.use(
            http.get('/test-500', () => {
                return HttpResponse.json({ message: 'Server exploded' }, { status: 500 });
            })
        );

        await expect(apiClient.get('/test-500')).rejects.toEqual({
            message: 'Server exploded',
            details: { message: 'Server exploded' }
        });
    });

    it('should use a default error message if none is provided', async () => {
        server.use(
            http.get('/test-500-no-message', () => {
                return HttpResponse.json({ detail: 'Some other error format' }, { status: 500 });
            })
        );

        await expect(apiClient.get('/test-500-no-message')).rejects.toEqual({
            message: 'An unexpected error occurred',
            details: { detail: 'Some other error format' }
        });
    });
  });
}); 