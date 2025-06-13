import { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Collapse,
    Stack,
    Chip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import type { ChannelState } from '../../../../../../types/schema';
import { ChannelList } from '../ChannelList';
import { useChannels } from '../../../../../../contexts/ChannelContext';

export interface ChannelGroupProps {
    groupName: string;
    channels: ChannelState[];
    defaultExpanded?: boolean;
    searchText?: string;
}

export const ChannelGroup = ({
    groupName,
    channels,
    defaultExpanded = true,
    searchText
}: ChannelGroupProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const { channelStates } = useChannels();

    // Get status stats for this group
    const stats = useMemo(() => {
        const groupChannelStates = channelStates.filter(state => 
            channels.some(c => c.channelName === state.channelName)
        );
        const total = groupChannelStates.length;
        const online = groupChannelStates.filter(c => c.status === 'online').length;
        const unknown = groupChannelStates.filter(c => c.status === 'unknown').length;
        return { total, online, unknown };
    }, [channels, channelStates]);

    return (
        <Paper 
            variant="outlined" 
            sx={{ 
                mb: 2,
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'background.default',
                    borderBottom: isExpanded ? 1 : 0,
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" component="div">
                        {groupName}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip 
                            size="small"
                            label={`${stats.online}/${stats.total} online`}
                            color={stats.online > 0 ? "success" : "default"}
                        />
                        {stats.unknown > 0 && (
                            <Chip
                                size="small"
                                label={`${stats.unknown} unknown`}
                                color="warning"
                            />
                        )}
                    </Stack>
                </Box>
                <IconButton
                    onClick={() => setIsExpanded(!isExpanded)}
                    size="small"
                    aria-label={isExpanded ? 'collapse' : 'expand'}
                >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            <Collapse in={isExpanded}>
                <Box sx={{ width: '100%', py: 2 }}>
                    <ChannelList 
                        viewMode="grid"
                        channels={channels}
                        searchText={searchText}
                    />
                </Box>
            </Collapse>
        </Paper>
    );
}; 