import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChannelStatus } from './useChannelStatus';
import { channelService } from '../services/api/channelService';
import type { Channel } from '../services/api/channelService';

vi.mock('../services/api/channelService');

const mockChannelNames = ['channel1', 'channel2'];

describe('useChannelStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should refresh a single channel status successfully', async () => {
        const initialChannels: Channel[] = [
            { channelName: 'channel1', status: 'offline', lastUpdated: new Date(0).toISOString() },
            { channelName: 'channel2', status: 'offline', lastUpdated: new Date(0).toISOString() },
        ];
        vi.mocked(channelService.getChannelStatuses).mockResolvedValue(initialChannels);

        const updatedChannel: Channel = {
            channelName: 'channel1',
            status: 'online',
            lastUpdated: new Date().toISOString(),
        };
        vi.mocked(channelService.getChannelStatus).mockResolvedValue(updatedChannel);
        
        const { result } = renderHook(() => useChannelStatus(mockChannelNames));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        
        await act(async () => {
            result.current.refreshChannel('channel1');
        });

        await waitFor(() => {
            const ch1 = result.current.channels.find(c => c.channelName === 'channel1');
            expect(ch1?.status).toBe('online');
        });

        const ch2 = result.current.channels.find(c => c.channelName === 'channel2');
        expect(ch2?.status).toBe('offline');
    });

    it('should handle errors when refreshing a single channel', async () => {
        const initialChannels: Channel[] = [
            { channelName: 'channel1', status: 'online', lastUpdated: new Date().toISOString() },
        ];
        vi.mocked(channelService.getChannelStatuses).mockResolvedValue(initialChannels);
        vi.mocked(channelService.getChannelStatus).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useChannelStatus(['channel1']));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            result.current.refreshChannel('channel1');
        });
        
        await waitFor(() => {
            const ch1 = result.current.channels.find(c => c.channelName === 'channel1');
            expect(ch1?.status).toBe('unknown');
        });
    });
}); 