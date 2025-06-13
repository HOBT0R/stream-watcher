export type ChannelView = 'all' | 'online' | 'offline';
export type ChannelRole = 'all' | 'runner' | 'commentator' | 'host' | 'tech';

export const CHANNEL_VIEWS: { value: ChannelView; label: string }[] = [
  { value: 'all', label: 'All Channels' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' }
];

export const CHANNEL_ROLES: { value: ChannelRole; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'runner', label: 'Runner' },
  { value: 'commentator', label: 'Commentator' },
  { value: 'host', label: 'Host' },
  { value: 'tech', label: 'Tech' }
]; 