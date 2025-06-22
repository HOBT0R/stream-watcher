import { createContext, useContext, ReactNode, useMemo } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useAuth } from './AuthContext';

interface ApiContextType {
    apiClient: AxiosInstance;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();

    const apiClient = useMemo(() => {
        const client = axios.create({
            baseURL: '/', // Use relative URLs to talk to the proxy
        });

        // Add a request interceptor to inject the auth token
        client.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return client;

    }, [token]);

    return (
        <ApiContext.Provider value={{ apiClient }}>
            {children}
        </ApiContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApiClient = () => {
    const context = useContext(ApiContext);
    if (context === undefined) {
        throw new Error('useApiClient must be used within an ApiProvider');
    }
    return context;
}; 