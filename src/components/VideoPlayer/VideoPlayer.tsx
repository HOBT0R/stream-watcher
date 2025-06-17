import { useEffect, useRef } from 'react';
import { useTwitchPlayer, TwitchPlayerInstance } from '../../hooks/useTwitchPlayer';
import { Box } from '@mui/material';

interface VideoPlayerProps {
  channelName: string;
  displayName: string;
}

const VideoPlayer = ({ channelName, displayName }: VideoPlayerProps) => {
    const TwitchPlayer = useTwitchPlayer();
    const playerDivRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<TwitchPlayerInstance | null>(null);

    useEffect(() => {
        if (!TwitchPlayer || !playerDivRef.current) {
            return;
        }

        const playerOptions = {
            channel: channelName,
            width: '100%',
            height: '100%',
            parent: ['localhost', 'stream-watcher.app'],
            autoplay: false,
            muted: false,
            controls: true,
        };

        const player = new TwitchPlayer(playerDivRef.current.id, playerOptions);
        player.addEventListener(TwitchPlayer.READY, () => {
            player.play();
        });
        playerRef.current = player;
        
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [TwitchPlayer, channelName]);

    const playerDivId = `twitch-player-${channelName}`;

    return (
        <Box
            ref={playerDivRef}
            id={playerDivId}
            sx={{
                width: '100%',
                height: '100%',
            }}
            aria-label={`Live stream for ${displayName}`}
        >
        </Box>
    );
};

export default VideoPlayer; 