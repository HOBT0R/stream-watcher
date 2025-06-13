import { useLocalStorage } from './useLocalStorage';
import type { ChannelConfig } from '../types/schema';
import { arrayToChannels, transformImportedConfig } from '../utils/channelTransform';
import defaultConfig from '../config/defaults.json';

// Transform default config to ensure proper types
const { channels: defaultChannels } = transformImportedConfig(defaultConfig);

/**
 * Manages the state and operations for channel configurations.
 * This hook centralizes all logic for adding, updating, deleting, importing, and exporting channel data.
 * It uses the `useLocalStorage` hook to persist the channel list.
 *
 * @returns An object containing the channel list, active channels, and handler functions.
 */
export const useChannelManagement = () => {
    const [channels, setChannels] = useLocalStorage<ChannelConfig[]>('channels', Object.values(defaultChannels));

    // Ensure channels is always an array
    const safeChannels = Array.isArray(channels) ? channels : Object.values(defaultChannels);
    const activeChannels = safeChannels.filter(c => c.isActive);

    const handleAddChannel = (channel: ChannelConfig) => {
        setChannels((prev: ChannelConfig[]) => [...prev, channel]);
    };

    const handleUpdateChannel = (channelName: string, updates: Partial<ChannelConfig>) => {
        setChannels((prev: ChannelConfig[]) => prev.map(channel => 
            channel.channelName === channelName 
                ? { ...channel, ...updates }
                : channel
        ));
    };

    const handleDeleteChannel = (channelName: string) => {
        setChannels((prev: ChannelConfig[]) => prev.filter(channel => channel.channelName !== channelName));
    };

    const handleImport = (importedChannels: ChannelConfig[]) => {
        setChannels(importedChannels);
    };

    const handleExport = () => {
        const config = arrayToChannels(safeChannels);
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'channel-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        channels: safeChannels,
        activeChannels,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel,
        handleImport,
        handleExport
    };
}; 