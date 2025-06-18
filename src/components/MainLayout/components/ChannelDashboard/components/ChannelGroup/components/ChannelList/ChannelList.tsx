import {
    Grid,
    Typography
} from '@mui/material';
import { ChannelCard } from '@/components/MainLayout/components/ChannelDashboard/components/ChannelGroup/components/ChannelCard/ChannelCard';
import type { ChannelState } from '@/types/schema';
import { useVideo } from '@/contexts/VideoContext';

export interface ChannelListProps {
    viewMode?: 'grid' | 'list';
    channels: ChannelState[];
    searchText?: string;
}

export const ChannelList = ({
    channels,
    searchText
}: ChannelListProps) => {
    const { playingVideos } = useVideo();

    if (!channels || channels.length === 0) {
        return (
            <Grid container justifyContent="center" alignItems="center" sx={{ p: 2, minHeight: 120 }}>
                <Grid >
                    <Typography variant="body1" color="text.secondary">
                        No channels to display.
                    </Typography>
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid container spacing={2} sx={{ width: '100%', maxWidth: '100vw', px: 2 }}>
            {channels.map(channel => {
                const isPlaying = playingVideos.includes(channel.channelName);
                const sizeSm = isPlaying ? 12 : 6;
                const sizeMd = isPlaying ? 8 : 4;
                const sizeLg = isPlaying ? 6 : 3;
                return (
                    <Grid 
                        key={channel.channelName} 
                        size={{ xs: 12, sm: sizeSm, md: sizeMd, lg: sizeLg }}
                    >
                        <ChannelCard
                            {...channel}
                            searchText={searchText}
                        />
                    </Grid>
                );
            })}
        </Grid>
    );
}; 