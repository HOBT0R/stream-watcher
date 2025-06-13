import { useState, useMemo } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Toolbar, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ChannelGroup } from './components/ChannelGroup';
import { useChannels } from '../../../../contexts/ChannelContext';
import { ChannelView, ChannelRole, CHANNEL_VIEWS, CHANNEL_ROLES } from '../../../../constants/channel';

export const ChannelDashboard = () => {
    const { channelStates } = useChannels();

    const [globalView, setGlobalView] = useState<ChannelView>('all');
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<ChannelRole>('all');

    // Filter channels based on global view selection and search text
    const filteredChannelsByView = useMemo(() => {
        let filtered = channelStates;

        // Apply global view filter
        switch (globalView) {
            case 'online':
                filtered = filtered.filter(c => c.status === 'online');
                break;
            case 'offline':
                filtered = filtered.filter(c => c.status === 'offline');
                break;
            case 'all':
            default:
                // No filter needed
                break;
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(channel => channel.role === roleFilter);
        }

        // Apply search filter
        if (searchText) {
            const lowerCaseSearchText = searchText.toLowerCase();
            filtered = filtered.filter(channel => 
                channel.channelName.toLowerCase().includes(lowerCaseSearchText) ||
                (channel.displayName && channel.displayName.toLowerCase().includes(lowerCaseSearchText)) ||
                (channel.description && channel.description.toLowerCase().includes(lowerCaseSearchText)) ||
                channel.group.toLowerCase().includes(lowerCaseSearchText)
            );
        }

        return filtered;
    }, [globalView, searchText, roleFilter, channelStates]);

    // Get unique groups from the filtered channels
    const groups = Array.from(new Set(filteredChannelsByView.map(c => c.group))).sort();

    return (
        <Box>
            <Toolbar sx={{ justifyContent: 'space-between', bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <ToggleButtonGroup
                    value={globalView}
                    exclusive
                    onChange={(_, newView) => {
                        if (newView !== null) {
                            setGlobalView(newView);
                        }
                    }}
                    aria-label="global channel view"
                    size="small"
                >
                    {CHANNEL_VIEWS.map(({ value, label }) => (
                        <ToggleButton key={value} value={value} color="primary">
                            {label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select
                        labelId="role-select-label"
                        value={roleFilter}
                        label="Role"
                        onChange={(e) => setRoleFilter(e.target.value as ChannelRole)}
                    >
                        {CHANNEL_ROLES.map(({ value, label }) => (
                            <MenuItem key={value} value={value}>
                                {label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    size="small"
                    label="Search Channels"
                    variant="outlined"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    sx={{ width: '30%' }}
                />
            </Toolbar>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                {groups.map(group => (
                    <ChannelGroup
                        key={group}
                        groupName={group}
                        channels={filteredChannelsByView.filter(c => c.group === group)}
                        defaultExpanded
                        searchText={searchText}
                    />
                ))}
            </Box>
        </Box>
    );
}; 