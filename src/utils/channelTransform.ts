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
    return (VALID_ROLES as readonly string[]).includes(role);
}

function validateAndTransformChannel(channel: unknown): ChannelConfig {
    if (typeof channel !== 'object' || channel === null) {
        throw new Error('Invalid channel: must be an object');
    }

    const c = channel as Record<string, unknown>;

    if (!c.channelName || typeof c.channelName !== 'string' || !c.group || typeof c.group !== 'string') {
        throw new Error(`Invalid channel: missing required fields (channelName, group)`);
    }

    // Transform role if present
    if (c.role !== undefined) {
        if (typeof c.role !== 'string' || !isValidRole(c.role)) {
            throw new Error(`Invalid role "${c.role}" for channel ${c.channelName}. Must be one of: ${VALID_ROLES.join(', ')}`);
        }
    }

    return {
        channelName: c.channelName,
        displayName: typeof c.displayName === 'string' ? c.displayName : undefined,
        group: c.group,
        description: typeof c.description === 'string' ? c.description : undefined,
        role: c.role as ChannelRole | undefined,
        isActive: typeof c.isActive === 'boolean' ? c.isActive : true
    };
}

export function transformImportedConfig(data: unknown): ChannelConfigData {
    if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid configuration format: data must be an object');
    }

    const d = data as Record<string, unknown>;

    if (!d.channels || typeof d.channels !== 'object' || d.channels === null) {
        throw new Error('Invalid configuration format: missing or invalid channels object');
    }

    const transformedChannels: Record<string, ChannelConfig> = {};
    
    // Transform each channel
    Object.entries(d.channels as Record<string, unknown>).forEach(([key, channel]) => {
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