/**
 * Application-wide configuration constants
 */

/**
 * Channel polling configuration
 */
export const CHANNEL_POLLING = {
    /** Default polling interval in seconds */
    DEFAULT_INTERVAL_SECONDS: 60,
    /** Minimum allowed polling interval in seconds */
    MIN_INTERVAL_SECONDS: 30,
} as const;

/**
 * API configuration
 */
export const API = {
    /** Default timeout for API requests in milliseconds */
    DEFAULT_TIMEOUT_MS: 10000,
} as const;

export const MIN_POLLING_INTERVAL = 30;
export const MAX_POLLING_INTERVAL = 900;
export const DEFAULT_POLLING_INTERVAL = 90; 