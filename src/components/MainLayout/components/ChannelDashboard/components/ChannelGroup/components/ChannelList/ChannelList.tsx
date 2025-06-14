import { 
    Box, 
    Typography
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ChannelCard } from '../ChannelCard/ChannelCard';
import type { ChannelState } from '../../../../../../../../types/schema';
import { useChannelEdit } from '../../../../../../../../contexts/ChannelEditContext';

export interface ChannelListProps {
    viewMode?: 'grid' | 'list';
    channels: ChannelState[];
    searchText?: string;
}

export const ChannelList = ({
    channels,
    searchText
}: ChannelListProps) => {
    const { openChannelEditDialog } = useChannelEdit();

    const handleCopy = async (channelName: string) => {
        await navigator.clipboard.writeText(channelName);
    };

    const handleOpenStreamKey = () => {
        // This will be handled by the ChannelCard component internally
    };

    const handleEdit = (channel: ChannelState) => {
        openChannelEditDialog({
            channelName: channel.channelName,
            displayName: channel.displayName,
            group: channel.group,
            description: channel.description,
            role: channel.role,
            isActive: channel.isActive
        });
    };

    if (!channels || channels.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No channels to display.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: '100vw', px: 0 }}>
                <Grid container spacing={2}>
                    {channels.map(channel => (
                        <Grid
                            key={channel.channelName}
                            size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                        >
                            <ChannelCard 
                                {...channel} 
                                searchText={searchText}
                                onCopy={() => handleCopy(channel.channelName)}
                                onOpenStreamKey={handleOpenStreamKey}
                                onEdit={() => handleEdit(channel)}
                            />
                        </Grid>
                    ))}
                </Grid>
            
        </Box>
    );
}; 