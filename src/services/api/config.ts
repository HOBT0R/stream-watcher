import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { API } from '../../constants/config';

// BFF API endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
    (config: InternalAxiosRequestConfig) => {
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