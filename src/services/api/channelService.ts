import { isAxiosError, AxiosInstance } from 'axios';
import { apiClient as defaultClient } from './config';

export interface Channel {
    channelName: string;
    status?: 'online' | 'offline' | 'unknown';
    lastUpdated: string;
    authUrl?: string;
}

export interface ChannelStatusRequest {
    channels: { channelName: string }[];
}

export interface ChannelStatusResponse {
    channels: {
        channelName: string;
        status?: 'online' | 'offline';
    }[];
}

export interface StreamKeyResponse {
    streamKey: string;
}

export interface AuthRequiredError {
    message: string;
    authUrl: string;
}

export const channelService = {
    /**
     * Get the status of multiple Twitch channels
     * @param apiClient The configured axios instance
     * @param channelNames Array of channel names to check
     * @returns Promise with channel statuses
     */
    getChannelStatuses: async (
        apiClientOrNames: AxiosInstance | string[],
        maybeNames?: string[]
    ): Promise<Channel[]> => {
        const apiClient = Array.isArray(apiClientOrNames) ? defaultClient : apiClientOrNames;
        const channelNames = Array.isArray(apiClientOrNames) ? apiClientOrNames : maybeNames ?? [];

        const request: ChannelStatusRequest = {
            channels: channelNames.map(name => ({ channelName: name }))
        };

        if (import.meta.env.DEV) {
            console.log('Sending channel status request:', {
                endpoint: '/api/v1/statuses',
                payload: request,
                channelCount: channelNames.length
            });
        }

        try {
            const response = await apiClient.post<ChannelStatusResponse>('/api/v1/statuses', request);
            const now = new Date().toISOString();
            const statusMap = new Map(response.data.channels.map(c => [c.channelName, c.status]));

            return channelNames.map(name => ({
                channelName: name,
                status: statusMap.get(name) || 'unknown',
                lastUpdated: now,
                authUrl: ''
            }));
        } catch (error) {
            console.error('Failed to fetch channel statuses:', error);
            throw error;
        }
    },

    /**
     * Get the status of a single Twitch channel
     * @param apiClient The configured axios instance
     * @param channelName Name of the channel to check
     * @returns Promise with the channel status
     */
    getChannelStatus: async (
        apiClientOrName: AxiosInstance | string,
        maybeName?: string
    ): Promise<Channel> => {
        const apiClient = typeof apiClientOrName === 'string' ? defaultClient : apiClientOrName;
        const channelName = typeof apiClientOrName === 'string' ? apiClientOrName : maybeName as string;
        // We can just use the plural version to keep the API surface smaller
        const statuses = await channelService.getChannelStatuses(apiClient, [channelName]);
        return statuses[0];
    },

    /**
     * Get the stream key for a specific channel
     * This will handle the OAuth flow internally if needed
     * @param apiClient The configured axios instance
     * @param channelName Name of the channel
     * @returns Promise with the stream key
     * @throws AuthRequiredError if authentication is needed
     */
    getStreamKey: async (
        apiClientOrName: AxiosInstance | string,
        maybeName?: string
    ): Promise<StreamKeyResponse> => {
        const apiClient = typeof apiClientOrName === 'string' ? defaultClient : apiClientOrName;
        const channelName = typeof apiClientOrName === 'string' ? apiClientOrName : maybeName as string;
        try {
            const response = await apiClient.get<string>('/api/v1/getStreamKey', {
                params: { 
                    channelName,
                    originalUrl: window.location.href
                },
                validateStatus: (status) => {
                    return status === 200 || status === 302;
                }
            });

            // If we got a 302, the response data is the auth URL
            if (response.status === 302) {
                throw {
                    message: 'Authentication required',
                    authUrl: response.data
                } as AuthRequiredError;
            }

            // If we got here, we have a successful response with the stream key
            return { streamKey: response.data };
        } catch (error) {
            // If we got a 302 response in the error, use its data as the auth URL
            if (isAxiosError(error) && error.response?.status === 302) {
                throw {
                    message: 'Authentication required',
                    authUrl: error.response.data as string,
                } as AuthRequiredError;
            }

            // For any other error, just throw it
            throw error;
        }
    }
}; 