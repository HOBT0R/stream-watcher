import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { API } from '../../constants/config';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

// Use explicit API base URL during development so the Vite dev server can
// proxy or hit the BFF directly. For the built/released app (production),
// use a relative URL so that requests go to the same origin/port where the
// frontend is served, letting the preview server handle proxying.
const API_BASE_URL = '';

// Create axios instance with default config
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: API.DEFAULT_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // Disable credentials for now to simplify CORS
    withCredentials: false
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request details in development
        if (import.meta.env.DEV) {
            console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
            console.log(`API Response: ${response.status} ${response.config.url}`);
        }
        return response;
    },
    async (error) => {
        // Log errors in development
        if (import.meta.env.DEV) {
            console.error('API Error:', {
                url: error.config?.url,
                status: error.response?.status,
                message: error.message
            });
        }

        // Handle token expiration specifically
        if (error.response?.status === 401) {
            const errorData = error.response.data?.error;
            
            // Check if this is a TOKEN_EXPIRED error or has requiresLogout flag
            if (errorData?.code === 'TOKEN_EXPIRED' || errorData?.requiresLogout === true) {
                console.warn('Token expired, automatically logging out user');
                
                try {
                    // Trigger logout to clear the expired token and redirect to login
                    await signOut(auth);
                    
                    // Optionally redirect to login page if not already there
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login?reason=token_expired';
                    }
                } catch (logoutError) {
                    console.error('Error during automatic logout:', logoutError);
                }
                
                // Return a specific error for expired tokens
                return Promise.reject({
                    message: 'Your session has expired. Please log in again.',
                    code: 'TOKEN_EXPIRED',
                    requiresLogout: true
                });
            }
            
            // Handle other 401 errors (invalid credentials, etc.)
            return Promise.reject({
                message: 'Authentication failed',
                details: error.response.data
            });
        }

        // Handle specific error cases
        if (error.response?.status === 400) {
            return Promise.reject({
                message: 'Invalid request',
                details: error.response.data
            });
        }

        if (error.response?.status === 403) {
            return Promise.reject({
                message: 'Access forbidden',
                details: error.response.data
            });
        }

        if (!error.response) {
            return Promise.reject({
                message: 'Network error',
                details: error
            });
        }
        
        return Promise.reject({
            message: error.response.data?.message || 'An unexpected error occurred',
            details: error.response.data
        });
    }
);

export default apiClient; 