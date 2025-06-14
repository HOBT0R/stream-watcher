import { renderHook, act } from '@testing-library/react';
import type { ChannelConfig } from '../types/schema';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import type { Mock } from 'vitest';

// Mock module (you MUST do this before importing the module under test)
const mockUseLocalStorage = vi.fn();
vi.mock('./useLocalStorage', () => ({
  useLocalStorage: mockUseLocalStorage
}));


// Test data
const TEST_CHANNELS = {
    channel1: { channelName: 'channel1', isActive: true, group: 'default' },
    channel2: { channelName: 'channel2', isActive: false, group: 'default' },
    channel3: { channelName: 'channel3', isActive: true, group: 'default' },
    newChannel1: { channelName: 'newChannel1', isActive: true, group: 'default' },
    newChannel2: { channelName: 'newChannel2', isActive: true, group: 'default' }
} as const;

const MOCK_CHANNELS_ARRAY = [TEST_CHANNELS.channel1, TEST_CHANNELS.channel2];

// Mock transformImportedConfig and arrayToChannels
vi.mock('../utils/channelTransform', () => ({
    transformImportedConfig: () => ({
        channels: {
            channel1: TEST_CHANNELS.channel1,
            channel2: TEST_CHANNELS.channel2
        }
    }),
    arrayToChannels: (channels: any) => channels
}));

// (Note): We import useChannelManagement lazily inside helper fn below; no need for a top-level variable.

type UseChannelManagementReturn = {
    channels: ChannelConfig[];
    activeChannels: ChannelConfig[];
    handleAddChannel: (channel: ChannelConfig) => void;
    handleUpdateChannel: (channelName: string, updates: Partial<ChannelConfig>) => void;
    handleDeleteChannel: (channelName: string) => void;
    handleImport: (channels: ChannelConfig[]) => void;
    handleExport: () => void;
};

describe('useChannelManagement', () => {
    let setChannels: Mock;
    let result: { current: UseChannelManagementReturn };
    let currentChannels: ChannelConfig[];

    const renderHookWithState = async () => {
        const { useChannelManagement } = await import('./useChannelManagement');
        return renderHook(() => useChannelManagement());
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        currentChannels = [...MOCK_CHANNELS_ARRAY];

        setChannels = vi.fn((callback: any) => {
            if (typeof callback === 'function') {
                currentChannels = callback(currentChannels);
            } else {
                currentChannels = callback;
            }
            mockUseLocalStorage.mockImplementation(() => [currentChannels, setChannels]);
            return currentChannels;
        });

        mockUseLocalStorage.mockImplementation(() => [currentChannels, setChannels]);

        const hookResult = await renderHookWithState();
        result = { current: hookResult.result.current as UseChannelManagementReturn };
    });

    it('returns channels and active channels', () => {
        expect(result.current.channels).toEqual(MOCK_CHANNELS_ARRAY);
        expect(result.current.activeChannels).toEqual([TEST_CHANNELS.channel1]);
    });

    it('handles adding a channel', async () => {
        act(() => {
            result.current.handleAddChannel(TEST_CHANNELS.channel3);
        });

        // Re-render to get updated state
        const hookResult = await renderHookWithState();
        result = { current: hookResult.result.current as UseChannelManagementReturn };

        expect(result.current.channels).toContainEqual(TEST_CHANNELS.channel3);
        expect(result.current.activeChannels).toContainEqual(TEST_CHANNELS.channel3);
    });

    it('handles updating a channel', async () => {
        const updates = { isActive: false };

        act(() => {
            result.current.handleUpdateChannel(TEST_CHANNELS.channel1.channelName, updates);
        });

        // Re-render to get updated state
        const hookResult = await renderHookWithState();
        result = { current: hookResult.result.current as UseChannelManagementReturn };

        const updatedChannel = result.current.channels.find(c => c.channelName === TEST_CHANNELS.channel1.channelName);
        expect(updatedChannel).toEqual({ ...TEST_CHANNELS.channel1, ...updates });
        expect(result.current.activeChannels).not.toContainEqual(updatedChannel);
    });

    it('handles deleting a channel', async () => {
        act(() => {
            result.current.handleDeleteChannel(TEST_CHANNELS.channel1.channelName);
        });

        // Re-render to get updated state
        const hookResult = await renderHookWithState();
        result = { current: hookResult.result.current as UseChannelManagementReturn };

        expect(result.current.channels).not.toContainEqual(TEST_CHANNELS.channel1);
        expect(result.current.activeChannels).not.toContainEqual(TEST_CHANNELS.channel1);
        expect(result.current.channels).toContainEqual(TEST_CHANNELS.channel2);
    });

    it('handles importing channels', async () => {
        const importedChannels = [TEST_CHANNELS.newChannel1, TEST_CHANNELS.newChannel2];

        act(() => {
            result.current.handleImport(importedChannels);
        });

        // Re-render to get updated state
        const hookResult = await renderHookWithState();
        result = { current: hookResult.result.current as UseChannelManagementReturn };

        expect(result.current.channels).toEqual(importedChannels);
        expect(result.current.activeChannels).toEqual(importedChannels);
    });
}); 