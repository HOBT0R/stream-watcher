import { apiClient } from './config';

export interface Channel {
    channelName: string;
    status?: 'online' | 'offline';
}

export interface ChannelStatusRequest {
    channels: Channel[];
}

export interface ChannelStatusResponse {
    channels: Channel[];
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
     * @param channelNames Array of channel names to check
     * @returns Promise with channel statuses
     */
    getChannelStatuses: async (channelNames: string[]): Promise<Channel[]> => {
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
            return response.data.channels;
        } catch (error) {
            console.error('Failed to fetch channel statuses:', error);
            throw error;
        }
    },

    /**
     * Get the stream key for a specific channel
     * This will handle the OAuth flow internally if needed
     * @param channelName Name of the channel
     * @returns Promise with the stream key
     * @throws AuthRequiredError if authentication is needed
     */
    getStreamKey: async (channelName: string): Promise<StreamKeyResponse> => {
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
        } catch (error: any) {
            // If we got a 302 response in the error, use its data as the auth URL
            if (error?.response?.status === 302) {
                throw {
                    message: 'Authentication required',
                    authUrl: error.response.data
                } as AuthRequiredError;
            }

            // For any other error, just throw it
            throw error;
        }
    }
}; 