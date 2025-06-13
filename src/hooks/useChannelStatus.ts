import { useState, useEffect, useCallback, useRef } from 'react';
import type { Channel } from '../services/api/channelService';
import { channelService } from '../services/api/channelService';
import { CHANNEL_POLLING } from '../constants/config';

export function useChannelStatus(channelNames: string[], pollingIntervalSeconds?: number) {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const lastPollTimeRef = useRef<Date | null>(null);
    const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPollingRef = useRef(false);

    // Memoize the fetch function to prevent unnecessary recreations
    const fetchChannelStatuses = useCallback(async () => {
        // Don't fetch if there are no channels or if we're already polling
        if (channelNames.length === 0 || isPollingRef.current) {
            return;
        }

        isPollingRef.current = true;
        const now = new Date();
        
        // Check if enough time has passed since the last poll
        if (lastPollTimeRef.current) {
            const timeSinceLastPoll = (now.getTime() - lastPollTimeRef.current.getTime()) / 1000;
            const minInterval = Math.max(
                pollingIntervalSeconds || CHANNEL_POLLING.DEFAULT_INTERVAL_SECONDS,
                CHANNEL_POLLING.MIN_INTERVAL_SECONDS
            );
            
            if (timeSinceLastPoll < minInterval) {
                console.log(`Skipping poll - only ${timeSinceLastPoll.toFixed(1)} seconds since last poll (minimum: ${minInterval}s)`);
                isPollingRef.current = false;
                return;
            }
        }
        
        lastPollTimeRef.current = now;
        
        try {
            const updatedChannels = await channelService.getChannelStatuses(channelNames);
            setChannels(updatedChannels);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch channel statuses'));
            console.error('Error fetching channel statuses:', err);
        } finally {
            setIsLoading(false);
            isPollingRef.current = false;
        }
    }, [channelNames, pollingIntervalSeconds]);

    useEffect(() => {
        // Clean up any existing interval
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }

        // Don't set up polling if there are no channels
        if (channelNames.length === 0) {
            setChannels([]);
            setIsLoading(false);
            return;
        }

        // Calculate polling interval, ensuring it's at least the minimum
        const intervalSeconds = Math.max(
            pollingIntervalSeconds || CHANNEL_POLLING.DEFAULT_INTERVAL_SECONDS,
            CHANNEL_POLLING.MIN_INTERVAL_SECONDS
        );
        const intervalMs = intervalSeconds * 1000;
        
        // Initial fetch
        fetchChannelStatuses();

        // Set up new interval
        intervalIdRef.current = setInterval(() => {
            fetchChannelStatuses();
        }, intervalMs);

        // Cleanup function
        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        };
    }, [channelNames, pollingIntervalSeconds, fetchChannelStatuses]);

    return {
        channels,
        isLoading,
        error,
        refetch: fetchChannelStatuses
    };
} 