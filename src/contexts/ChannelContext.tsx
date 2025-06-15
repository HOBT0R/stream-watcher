import React, { createContext, useContext, useMemo, useReducer, useCallback, useEffect } from 'react';
import type { ChannelState, ChannelConfig, ChannelStatus } from '../types/schema';
import { useChannelStatus } from '../hooks/useChannelStatus';
import { useLocalStorage } from '../hooks/useLocalStorage';
import defaults from '../config/defaults.json';

// ====================================================================================
// Reducer and Actions for Channel Configuration
// ====================================================================================

type Action =
    | { type: 'ADD_CHANNEL'; payload: ChannelConfig }
    | { type: 'UPDATE_CHANNEL'; payload: { channelName: string; updates: Partial<ChannelConfig> } }
    | { type: 'DELETE_CHANNEL'; payload: string }
    | { type: 'IMPORT_CHANNELS'; payload: ChannelConfig[] };

const channelReducer = (state: ChannelConfig[], action: Action): ChannelConfig[] => {
    switch (action.type) {
        case 'ADD_CHANNEL':
            if (state.some(c => c.channelName === action.payload.channelName)) {
                return state; // Prevent duplicates
            }
            return [...state, action.payload];
        case 'UPDATE_CHANNEL':
            return state.map(c =>
                c.channelName === action.payload.channelName ? { ...c, ...action.payload.updates } : c
            );
        case 'DELETE_CHANNEL':
            return state.filter(c => c.channelName !== action.payload);
        case 'IMPORT_CHANNELS':
            return action.payload;
        default:
            return state;
    }
};

const transformedChannels = Object.values(defaults.channels);

// ====================================================================================
// Context Definition
// ====================================================================================

interface ChannelContextType {
    channelStates: ChannelState[];
    isLoading: boolean;
    error: Error | null;
    refetchChannels: () => void;
    refreshChannel: (channelName: string) => void;
    channels: ChannelConfig[];
    addChannel: (channel: ChannelConfig) => void;
    updateChannel: (channelName: string, updates: Partial<ChannelConfig>) => void;
    deleteChannel: (channelName: string) => void;
    importChannels: (channels: ChannelConfig[]) => void;
    exportChannels: () => void;
}

const ChannelContext = createContext<ChannelContextType | null>(null);

export const useChannels = () => {
    const context = useContext(ChannelContext);
    if (!context) {
        throw new Error('useChannels must be used within a ChannelProvider');
    }
    return context;
};

// ====================================================================================
// Provider Component
// ====================================================================================

interface ChannelProviderProps {
    children: React.ReactNode;
    pollingIntervalSeconds?: number;
}

export const ChannelProvider: React.FC<ChannelProviderProps> = ({ 
    children, 
    pollingIntervalSeconds 
}) => {
    const [storedChannels, setStoredChannels] = useLocalStorage<ChannelConfig[]>('channels', transformedChannels);
    const [channels, dispatch] = useReducer(channelReducer, storedChannels);

    useEffect(() => {
        setStoredChannels(channels);
    }, [channels, setStoredChannels]);

    const activeChannels = useMemo(() => channels.filter(c => c.isActive), [channels]);
    const channelNames = useMemo(() => activeChannels.map(c => c.channelName), [activeChannels]);

    const { 
        channels: statusUpdates, 
        isLoading, 
        error, 
        refetch,
        refreshChannel,
    } = useChannelStatus(channelNames, pollingIntervalSeconds);

    const mergedChannelStates = useMemo((): ChannelState[] => {
        return channelNames.map(name => {
            const config = activeChannels.find(c => c.channelName === name);
            const status = statusUpdates.find(s => s.channelName === name);
            if (!config) {
                // This should not happen if logic is correct
                return null;
            }
            return {
                ...config,
                status: (status?.status || 'unknown') as ChannelStatus,
                lastUpdated: status?.lastUpdated || new Date(0).toISOString(),
            };
        }).filter((c): c is ChannelState => c !== null);
    }, [activeChannels, channelNames, statusUpdates]);

    const addChannel = useCallback((channel: ChannelConfig) => {
        dispatch({ type: 'ADD_CHANNEL', payload: channel });
    }, []);

    const updateChannel = useCallback((channelName: string, updates: Partial<ChannelConfig>) => {
        dispatch({ type: 'UPDATE_CHANNEL', payload: { channelName, updates } });
    }, []);

    const deleteChannel = useCallback((channelName: string) => {
        dispatch({ type: 'DELETE_CHANNEL', payload: channelName });
    }, []);

    const importChannels = useCallback((importedChannels: ChannelConfig[]) => {
        dispatch({ type: 'IMPORT_CHANNELS', payload: importedChannels });
    }, []);

    const exportChannels = useCallback(() => {
        const json = JSON.stringify(channels, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `channels-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [channels]);

    const value = useMemo<ChannelContextType>(() => ({
        channelStates: mergedChannelStates,
        isLoading,
        error,
        refetchChannels: refetch,
        refreshChannel,
        channels,
        addChannel,
        updateChannel,
        deleteChannel,
        importChannels,
        exportChannels,
    }), [
        mergedChannelStates, isLoading, error, refetch, refreshChannel, channels, 
        addChannel, updateChannel, deleteChannel, importChannels, exportChannels
    ]);

    return (
        <ChannelContext.Provider value={value}>
            {children}
        </ChannelContext.Provider>
    );
}; 