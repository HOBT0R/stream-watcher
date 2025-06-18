import { ChannelState } from '../types/schema';

export const applyFilters = (
    channels: ChannelState[], 
    { globalView, roleFilter, searchText }: { globalView: string, roleFilter: string, searchText: string }
) => {
    let filtered = channels;

    // Apply global view filter
    if (globalView !== 'all') {
        filtered = filtered.filter(c => c.status === globalView);
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
};

export const getStatusColor = (status: ChannelState['status']) => {
    switch (status) {
        case 'online': return 'success.main';
        case 'offline': return 'text.disabled';
        case 'unknown':
        default: return 'warning.main';
    }
};

export const getStatusChipColor = (status: ChannelState['status']) => {
    switch (status) {
        case 'online': return 'success';
        case 'offline': return 'primary';
        case 'unknown':
        default: return 'warning';
    }
};

export const getRoleChipColor = (role?: ChannelState['role']) => {
    switch (role) {
        case 'runner': return 'success';
        case 'commentator': return 'secondary';
        case 'host': return 'primary';
        case 'tech': return 'default';
        default: return 'default';
    }
}; 