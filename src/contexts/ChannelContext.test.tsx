import { render, screen } from '@testing-library/react';
import { ChannelProvider, useChannels } from './ChannelContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import defaults from '../config/defaults.json';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Mock the useLocalStorage hook
vi.mock('../hooks/useLocalStorage');

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
}); 