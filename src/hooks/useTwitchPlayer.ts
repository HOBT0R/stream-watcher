import { useState, useEffect } from 'react';

interface TwitchPlayer {
    new (embedDivId: string, options: object): TwitchPlayerInstance;
    READY: string;
}

export interface TwitchPlayerInstance {
    destroy: () => void;
    disableCaptions: () => void;
    enableCaptions: () => void;
    getChannel: () => string;
    getMuted: () => boolean;
    getVolume: () => number;
    setChannel: (channel: string) => void;
    setMuted: (muted: boolean) => void;
    setVolume: (volume: number) => void;
    getQualities: () => string[];
    isPaused: () => boolean;
    play: () => void;
    addEventListener: (event: string, callback: () => void) => void;
}

declare global {
    interface Window {
        Twitch: {
            Player: TwitchPlayer;
        };
    }
}

export const useTwitchPlayer = () => {
    const [twitchPlayer, setTwitchPlayer] = useState<TwitchPlayer | null>(null);

    useEffect(() => {
        // Since the script is now loaded globally via index.html,
        // we just need to wait for it to be available on the window object.
        if (window.Twitch && window.Twitch.Player) {
            setTwitchPlayer(() => window.Twitch.Player);
        } else {
            // Poll for the Twitch Player object if it's not immediately available.
            const intervalId = setInterval(() => {
                if (window.Twitch && window.Twitch.Player) {
                    setTwitchPlayer(() => window.Twitch.Player);
                    clearInterval(intervalId);
                }
            }, 100);

            return () => clearInterval(intervalId);
        }
    }, []);

    return twitchPlayer;
}; 