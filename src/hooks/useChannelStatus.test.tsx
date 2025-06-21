import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { useChannelStatus } from './useChannelStatus';
import { channelService, Channel } from '../services/api/channelService';
import { ApiProvider } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';

// --- Mocks ---
vi.mock('../services/api/channelService');
vi.mock('../contexts/AuthContext');

const mockedChannelService = channelService as Mocked<typeof channelService>;
const mockedUseAuth = vi.mocked(useAuth);

// --- Test Wrapper ---
const TestWrapper = ({ children }: { children: ReactNode }) => (
    <ApiProvider>
        {children}
    </ApiProvider>
);

describe('useChannelStatus', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Provide a mock token for the ApiProvider to use
        mockedUseAuth.mockReturnValue({
            user: null,
            token: 'mock-token',
            login: vi.fn(),
            logout: vi.fn(),
            loading: false,
        });
    });

    it('should fetch channel statuses on mount and update state', async () => {
        const mockResponse: Channel[] = [
            { channelName: 'channel1', status: 'online', lastUpdated: new Date().toISOString(), authUrl: '' },
        ];
        mockedChannelService.getChannelStatuses.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useChannelStatus(['channel1']), { wrapper: TestWrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(mockedChannelService.getChannelStatuses).toHaveBeenCalledTimes(1);
            expect(result.current.channels).toEqual(mockResponse);
        });
    });

    it('should handle errors from the API gracefully', async () => {
        const testError = new Error('Failed to fetch');
        mockedChannelService.getChannelStatuses.mockRejectedValue(testError);

        const { result } = renderHook(() => useChannelStatus(['channel1']), { wrapper: TestWrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBe(testError);
        });
    });

    it('should correctly refresh a single channel', async () => {
        const initialResponse: Channel[] = [{ channelName: 'ch1', status: 'offline', lastUpdated: '', authUrl: '' }];
        mockedChannelService.getChannelStatuses.mockResolvedValue(initialResponse);
        
        const refreshedChannel: Channel = { channelName: 'ch1', status: 'online', lastUpdated: new Date().toISOString(), authUrl: '' };
        mockedChannelService.getChannelStatus.mockResolvedValue(refreshedChannel);
        
        const { result } = renderHook(() => useChannelStatus(['ch1']), { wrapper: TestWrapper });
        
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        
        await act(async () => {
            await result.current.refreshChannel('ch1');
        });
        
        expect(mockedChannelService.getChannelStatus).toHaveBeenCalledWith(expect.anything(), 'ch1');
        
        // The channel state should be updated after refresh
        const channel = result.current.channels.find(c => c.channelName === 'ch1');
        expect(channel?.status).toBe('online');
    });
});