import type { ChannelConfig, ChannelRole } from '../types/schema';
import { VALID_ROLES } from '../types/schema';

export interface ChannelConfigData {
    channels: Record<string, ChannelConfig>;
}

export interface ValidationError {
    message: string;
    details?: string;
}

function isValidRole(role: string): role is ChannelRole {
    return VALID_ROLES.includes(role as ChannelRole);
}

function validateAndTransformChannel(channel: any): ChannelConfig {
    if (!channel.channelName || !channel.group) {
        throw new Error(`Invalid channel: missing required fields (channelName, group)`);
    }

    // Transform role if present
    if (channel.role !== undefined) {
        if (!isValidRole(channel.role)) {
            throw new Error(`Invalid role "${channel.role}" for channel ${channel.channelName}. Must be one of: ${VALID_ROLES.join(', ')}`);
        }
    }

    return {
        channelName: channel.channelName,
        displayName: channel.displayName,
        group: channel.group,
        description: channel.description,
        role: channel.role as ChannelRole | undefined,
        isActive: channel.isActive ?? true
    };
}

export function transformImportedConfig(data: any): ChannelConfigData {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid configuration format: data must be an object');
    }

    if (!data.channels || typeof data.channels !== 'object') {
        throw new Error('Invalid configuration format: missing or invalid channels object');
    }

    const transformedChannels: Record<string, ChannelConfig> = {};
    
    // Transform each channel
    Object.entries(data.channels).forEach(([key, channel]) => {
        try {
            transformedChannels[key] = validateAndTransformChannel(channel);
        } catch (error) {
            throw new Error(`Invalid channel "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    return { channels: transformedChannels };
}

export function validateChannelConfig(data: unknown): data is ChannelConfigData {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid configuration format: data must be an object');
    }

    const config = data as ChannelConfigData;
    if (!config.channels || typeof config.channels !== 'object') {
        throw new Error('Invalid configuration format: missing or invalid channels object');
    }

    // Validate and transform each channel
    Object.entries(config.channels).forEach(([key, channel]) => {
        try {
            config.channels[key] = validateAndTransformChannel(channel);
        } catch (error) {
            throw new Error(`Invalid channel "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    return true;
}

export function parseChannelConfig(jsonString: string): ChannelConfigData {
    try {
        const data = JSON.parse(jsonString);
        return transformImportedConfig(data);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON format');
        }
        throw error;
    }
}

export function channelsToArray(config: ChannelConfigData): ChannelConfig[] {
    return Object.values(config.channels);
}

export function arrayToChannels(channels: ChannelConfig[]): ChannelConfigData {
    return {
        channels: channels.reduce((acc, channel) => ({
            ...acc,
            [channel.channelName]: channel
        }), {} as Record<string, ChannelConfig>)
    };
} 