import { Circle as CircleIcon } from '@mui/icons-material';
import type { ChannelState } from '@/types/schema';
import { getStatusColor } from '@/utils/channelUtils';

export const StatusIndicator = ({ status }: { status: ChannelState['status'] }) => (
    <CircleIcon sx={{ 
        color: getStatusColor(status),
        fontSize: '1rem'
    }} />
); 