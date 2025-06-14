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
import { ChannelList } from './components/ChannelList';
import { useChannels } from '../../../../../../contexts/ChannelContext';
import { useChannelFilter } from '../../../../../../contexts/ChannelFilterContext';
import { applyFilters } from '../../../../../../utils/channelUtils';

export interface ChannelGroupProps {
    groupName: string;
    defaultExpanded?: boolean;
}

export const ChannelGroup = ({
    groupName,
    defaultExpanded = true,
}: ChannelGroupProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const { channelStates } = useChannels();
    const { globalView, roleFilter, searchText } = useChannelFilter();

    const filteredChannels = useMemo(() => {
        const groupChannels = channelStates.filter(channel => channel.group === groupName);
        return applyFilters(groupChannels, { globalView, roleFilter, searchText });
    }, [channelStates, groupName, globalView, roleFilter, searchText]);

    // Get status stats for this group based on the filtered list
    const stats = useMemo(() => {
        const total = filteredChannels.length;
        const online = filteredChannels.filter(c => c.status === 'online').length;
        const unknown = filteredChannels.filter(c => c.status === 'unknown').length;
        return { total, online, unknown };
    }, [filteredChannels]);

    if (filteredChannels.length === 0) {
        return null;
    }

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
                        channels={filteredChannels}
                        searchText={searchText}
                    />
                </Box>
            </Collapse>
        </Paper>
    );
}; 