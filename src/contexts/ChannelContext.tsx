import React, { createContext, useContext, useMemo } from 'react';
import type { ChannelState, ChannelConfig, ChannelStatus } from '../types/schema';
import { useChannelStatus } from '../hooks/useChannelStatus';
import { useChannelManagement } from '../hooks/useChannelManagement';

/**
 * @interface ChannelContextType
 * Defines the shape of the channel context, including channel states, loading/error status,
 * and management functions.
 */
interface ChannelContextType {
    /** The merged state of all active channels, including their configuration and current status. */
    channelStates: ChannelState[];
    /** A boolean indicating if the channel statuses are currently being fetched. */
    isLoading: boolean;
    /** An error object if fetching channel statuses fails. */
    error: Error | null;
    /** A function to manually trigger a refetch of channel statuses. */
    refetchChannels: () => void;
    /** The complete list of all channel configurations, both active and inactive. */
    channels: ChannelConfig[];
    /** A function to add a new channel to the configuration. */
    handleAddChannel: (channel: ChannelConfig) => void;
    /** A function to update an existing channel's configuration. */
    handleUpdateChannel: (channelName: string, updates: Partial<ChannelConfig>) => void;
    /** A function to delete a channel from the configuration. */
    handleDeleteChannel: (channelName: string) => void;
    /** A function to replace the current channel list with an imported one. */
    handleImport: (channels: ChannelConfig[]) => void;
    /** A function to export the current channel configuration to a JSON file. */
    handleExport: () => void;
}

const ChannelContext = createContext<ChannelContextType | null>(null);

/**
 * A hook for accessing channel status data.
 * This should be used by components that need to display channel states but do not need to manage them.
 * @returns The channel context, providing access to channelStates, isLoading, error, and refetchChannels.
 */
export const useChannels = () => {
    const context = useContext(ChannelContext);
    if (!context) {
        throw new Error('useChannels must be used within a ChannelProvider');
    }
    return context;
};

/**
 * A hook for accessing channel management functions.
 * This should be used by components that need to modify the channel configuration.
 * @returns An object with the full channel list and all management functions.
 */
export const useChannelManager = () => {
    const context = useContext(ChannelContext);
    if (!context) {
        throw new Error('useChannelManager must be used within a ChannelProvider');
    }
    return {
        channels: context.channels,
        handleAddChannel: context.handleAddChannel,
        handleUpdateChannel: context.handleUpdateChannel,
        handleDeleteChannel: context.handleDeleteChannel,
        handleImport: context.handleImport,
        handleExport: context.handleExport,
    };
}

interface ChannelProviderProps {
    children: React.ReactNode;
    pollingIntervalSeconds?: number;
}

/**
 * Provides the channel context to its children.
 * It integrates `useChannelManagement` and `useChannelStatus` to provide a single,
 * unified source for all channel-related data and actions.
 */
export const ChannelProvider: React.FC<ChannelProviderProps> = ({ 
    children, 
    pollingIntervalSeconds
}) => {
    const {
        channels,
        activeChannels,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel,
        handleImport,
        handleExport,
    } = useChannelManagement();

    // Memoize the channel names array to prevent unnecessary re-renders
    const channelNames = useMemo(() => {
        return activeChannels.map(c => c.channelName);
    }, [activeChannels]);

    const { channels: statusUpdates, isLoading, error, refetch } = useChannelStatus(channelNames, pollingIntervalSeconds);

    // Memoize the merged channel states to prevent unnecessary re-renders
    const mergedChannelStates = useMemo(() => {
        return channelNames.map(name => {
            const config = activeChannels.find(c => c.channelName === name);
            const status = statusUpdates.find(s => s.channelName === name);
            
            if (!config) {
                throw new Error(`Configuration not found for channel: ${name}`);
            }

            return {
                ...config,
                status: (status?.status || 'unknown') as ChannelStatus,
                lastUpdated: new Date().toISOString(),
            };
        });
    }, [activeChannels, channelNames, statusUpdates]);

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo<ChannelContextType>(() => ({
        channelStates: mergedChannelStates,
        isLoading,
        error,
        refetchChannels: refetch,
        channels,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel,
        handleImport,
        handleExport,
    }), [mergedChannelStates, isLoading, error, refetch, channels, handleAddChannel, handleUpdateChannel, handleDeleteChannel, handleImport, handleExport]);

    return (
        <ChannelContext.Provider value={value}>
            {children}
        </ChannelContext.Provider>
    );
}; 