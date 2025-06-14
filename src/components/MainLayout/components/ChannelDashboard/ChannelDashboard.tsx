import { useMemo } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Toolbar, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ChannelGroup } from './components/ChannelGroup';
import { useChannels } from '../../../../contexts/ChannelContext';
import { useChannelFilter } from '../../../../contexts/ChannelFilterContext';
import { CHANNEL_VIEWS, CHANNEL_ROLES } from '../../../../constants/channel';
import { applyFilters } from '../../../../utils/channelUtils';

export const ChannelDashboard = () => {
    const { channelStates } = useChannels();
    const { 
        globalView, setGlobalView, 
        searchText, setSearchText, 
        roleFilter, setRoleFilter 
    } = useChannelFilter();

    // Determine which groups to show based on the filters
    const visibleGroups = useMemo(() => {
        const filteredChannels = applyFilters(channelStates, { globalView, roleFilter, searchText });
        return Array.from(new Set(filteredChannels.map(c => c.group))).sort();
    }, [channelStates, globalView, roleFilter, searchText]);

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
                        onChange={(e) => setRoleFilter(e.target.value)}
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
                {visibleGroups.map(group => (
                    <ChannelGroup
                        key={group}
                        groupName={group}
                        defaultExpanded
                    />
                ))}
            </Box>
        </Box>
    );
}; 