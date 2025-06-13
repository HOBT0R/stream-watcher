/**
 * Represents the online/offline status of a channel
 */
export type ChannelStatus = 'online' | 'offline' | 'unknown';

/**
 * Valid roles for a channel
 */
export const VALID_ROLES = ['runner', 'commentator', 'host', 'tech'] as const;

/**
 * Type for valid channel roles
 */
export type ChannelRole = 'runner' | 'commentator' | 'host' | 'tech' | string;

/**
 * Represents a channel's configuration and metadata
 */
export interface ChannelConfig {
    /** The channel's unique name on Twitch */
    channelName: string;
    /** Optional display name if different from channel name */
    displayName?: string;
    /** The group this channel belongs to */
    group: string;
    /** Optional description or notes about the channel */
    description?: string;
    /** Optional role of the channel (e.g., 'runner', 'commentator', 'host', 'tech') */
    role?: ChannelRole;
    /** Whether to actively monitor this channel */
    isActive: boolean;
}

/**
 * Represents a channel's current state including status
 */
export interface ChannelState extends ChannelConfig {
    /** Current online/offline status */
    status: ChannelStatus;
    /** Last time the status was updated */
    lastUpdated: string;
    /** Stream key if available */
    streamKey?: string;
}

/**
 * Represents the application's persisted configuration
 */
export interface AppConfig {
    /** Map of channel configurations by channel name */
    channels: Record<string, ChannelConfig>;
    /** UI preferences */
    preferences: {
        /** Whether to show channels in a grid or list view */
        viewMode: 'grid' | 'list' | string;
        /** How often to poll for updates (in seconds) */
        pollInterval: number;
        /** Whether to show offline channels */
        showOffline: boolean;
    };
}

/**
 * Represents the current application state
 */
export interface AppState extends AppConfig {
    /** Current state of all channels */
    channelStates: Record<string, ChannelState>;
    /** Whether we're currently fetching updates */
    isLoading: boolean;
    /** Any error messages */
    error?: string;
} 