import { render, screen, renderHook, act } from '@testing-library/react';
import { ChannelProvider, useChannels } from './ChannelContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import defaults from '../config/defaults.json';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useChannelStatus } from '../hooks/useChannelStatus';
import { channelService } from '../services/api/channelService';
import { ChannelState } from '../types/schema';

// Mock the hooks
vi.mock('../hooks/useLocalStorage');
vi.mock('../hooks/useChannelStatus');
vi.mock('../services/api/channelService');

// Test component to consume the context
const TestConsumer = () => {
    const { channels } = useChannels();
    return (
        <div>
            {channels.map(channel => (
                <div key={channel.channelName}>{channel.displayName}</div>
            ))}
        </div>
    );
};

describe('ChannelProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads default channels when localStorage is empty', () => {
        // Arrange
        const transformedChannels = Object.values(defaults.channels);
        const setStoredChannels = vi.fn();
        vi.mocked(useLocalStorage).mockReturnValue([transformedChannels, setStoredChannels]);
        vi.mocked(useChannelStatus).mockReturnValue({
            channels: [],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
            refreshChannel: vi.fn(),
            setChannels: vi.fn(),
        });


        // Act
        render(
            <ChannelProvider>
                <TestConsumer />
            </ChannelProvider>
        );

        // Assert
        transformedChannels.forEach(channel => {
            expect(screen.getByText(channel.displayName as string)).toBeInTheDocument();
        });
    });

    it('should update a single channel status upon calling refreshChannel', async () => {
        // 1. Arrange
        const initialConfigs = [{ channelName: 'test-channel', displayName: 'Test Channel', group: 'A', isActive: true, role: 'runner' }];
        const initialStatuses: ChannelState[] = [{ ...initialConfigs[0], status: 'offline', lastUpdated: new Date().toISOString() }];
        const updatedStatus: ChannelState = { ...initialConfigs[0], status: 'online', lastUpdated: new Date().toISOString() };
        
        const setStatusUpdates = vi.fn();
        
        vi.mocked(useLocalStorage).mockReturnValue([initialConfigs, vi.fn()]);
        vi.mocked(useChannelStatus).mockReturnValue({
            channels: initialStatuses,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
            refreshChannel: vi.fn(),
            setChannels: setStatusUpdates,
        });
        vi.mocked(channelService.getChannelStatus).mockResolvedValue(updatedStatus);

        const wrapper = ({ children }: { children: React.ReactNode }) => <ChannelProvider>{children}</ChannelProvider>;
        const { result } = renderHook(() => useChannels(), { wrapper });

        // Assert initial state
        expect(result.current.channelStates.find(c => c.channelName === 'test-channel')?.status).toBe('offline');

        // 2. Act
        await act(async () => {
            await result.current.refreshChannel('test-channel');
        });

        // 3. Assert that the state setter from the hook was called correctly
        expect(setStatusUpdates).toHaveBeenCalledTimes(1);
        const updaterFunction = setStatusUpdates.mock.calls[0][0];
        const newStatuses = updaterFunction(initialStatuses);
        
        expect(newStatuses.find((c: ChannelState) => c.channelName === 'test-channel')?.status).toBe('online');
    });
}); 