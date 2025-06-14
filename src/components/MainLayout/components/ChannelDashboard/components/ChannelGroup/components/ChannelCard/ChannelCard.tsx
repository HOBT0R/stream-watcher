import { useState } from 'react';
import { 
    Card, CardContent, Typography, Chip, IconButton, 
    Tooltip, Link, Snackbar, Grid 
} from '@mui/material';
import { 
    Circle as CircleIcon, 
    Key as KeyIcon, 
    OpenInNew as OpenInNewIcon, 
    ContentCopy as ContentCopyIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import type { ChannelState, ChannelConfig } from '../../../../../../../../types/schema';
import { StreamKeyDialog } from './components/StreamKeyDialog/StreamKeyDialog';
import { getTwitchChannelUrl } from '../../../../../../../../utils/twitch';
import { useChannelEdit } from '../../../../../../../../contexts/ChannelEditContext';
import { useChannels } from '../../../../../../../../contexts/ChannelContext';

// ================ Types ================
export interface ChannelCardProps extends ChannelState {
    searchText?: string;
    channelName: string;
    group: string;
}

// ================ Layout component ================
const CardLayout = ({
    displayName,
    status,
    openButton,
    channelName,
    description,
    roleChip,
    timestamp,
    refreshButton,
}: {
    displayName?: React.ReactNode;
    status: React.ReactNode;
    openButton: React.ReactNode;
    channelName: React.ReactNode;
    description?: React.ReactNode;
    roleChip?: React.ReactNode;
    timestamp: React.ReactNode;
    refreshButton?: React.ReactNode;
}) => (
    <Grid container direction="column" rowSpacing={1}>
        {/* ── Row 1 ── */}
        <Grid>
            <Grid container alignItems="flex-start" justifyContent="space-between">
                <Grid><div data-testid="channel-card-display-name">{displayName}</div></Grid>
                <Grid>{status} {openButton}</Grid>
            </Grid>
        </Grid>

        {/* ── Row 2 ── */}
        <Grid>{channelName}</Grid>

        {/* ── Row 3 ── */}
        <Grid>
            <Grid container justifyContent="space-between" alignItems="center" columnGap={1}>
                {/* left-most: description (if any) */}
                {description && (
                    <Grid>{description}</Grid>
                )}

                {/* middle chip (role) */}
                {roleChip && <Grid>{roleChip}</Grid>}

                {/* right-most: time stamp */}
                <Grid sx={{ marginLeft: 'auto' }}>
                    {timestamp}
                    {refreshButton}
                </Grid>
            </Grid>
        </Grid>
    </Grid>
);


// ================ Subcomponents ================

const ChannelNameWithActions = ({
    channelName,
    searchText,
    onCopy,
    onOpenStreamKey,
    onEdit,
}: {
    channelName: string;
    searchText?: string;
    onCopy: () => void;
    onOpenStreamKey: () => void;
    onEdit: () => void;
}) => (
    <>
        <Typography 
            variant="caption"
            color="text.secondary"
            onClick={onCopy}
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
        >
            {highlightText(channelName, searchText)}
        </Typography>
        <CopyButton onCopy={onCopy} />
        <StreamKeyButton onOpenStreamKey={onOpenStreamKey} />
        <EditButton onEdit={onEdit} />
    </>
);

const CopyButton = ({ onCopy }: { onCopy: () => void }) => (
    <Tooltip title="Copy Channel Name">
        <IconButton size="small" onClick={onCopy}>
            <ContentCopyIcon fontSize="small" />
        </IconButton>
    </Tooltip>
);

const StreamKeyButton = ({ onOpenStreamKey }: { onOpenStreamKey: () => void }) => (
    <Tooltip title="Get Stream Key">
        <IconButton size="small" onClick={onOpenStreamKey}>
            <KeyIcon fontSize="small" />
        </IconButton>
    </Tooltip>
);

const OpenButton = ({ twitchUrl }: { twitchUrl: string }) => (
    <Tooltip title="Open in Twitch">
      <Link href={twitchUrl} target="_blank" rel="noopener noreferrer">
        <OpenInNewIcon fontSize="small" />
      </Link>
    </Tooltip>
);

const EditButton = ({ onEdit }: { onEdit: () => void }) => (
    <Tooltip title="Edit Channel">
        <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
        </IconButton>
    </Tooltip>
);

const RefreshButton = ({ onRefresh }: { onRefresh: () => void }) => (
    <Tooltip title="Refresh Channel Status">
        <IconButton size="small" onClick={onRefresh}>
            <RefreshIcon fontSize="small" />
        </IconButton>
    </Tooltip>
);

const StatusIndicator = ({ status }: { status: ChannelState['status'] }) => (
    <CircleIcon sx={{ 
        color: getStatusColor(status),
        fontSize: '1rem'
    }} />
);


// ================ Utility Functions ================
const getStatusColor = (status: ChannelState['status']) => {
    switch (status) {
        case 'online': return 'success.main';
        case 'offline': return 'text.disabled';
        case 'unknown':
        default: return 'warning.main';
    }
};

const getRoleChipColor = (role?: ChannelState['role']) => {
    switch (role) {
        case 'runner': return 'success';
        case 'commentator': return 'secondary';
        case 'host': return 'primary';
        case 'tech': return 'default';
        default: return 'default';
    }
};

const highlightText = (text: string | undefined, query: string | undefined) => {
    if (!text || !query) return text;
    const lowerCaseText = text.toLowerCase();
    const lowerCaseQuery = query.toLowerCase();
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    for (let i = 0; i < lowerCaseText.length; i++) {
        const matchIndex = lowerCaseText.indexOf(lowerCaseQuery, i);
        if (matchIndex === -1) break;

        if (matchIndex > lastIndex) {
            parts.push(text.substring(lastIndex, matchIndex));
        }
        const endIndex = matchIndex + lowerCaseQuery.length;
        parts.push(
            <Typography 
                component="span" 
                key={matchIndex} 
                sx={{ backgroundColor: 'secondary.main', color: 'black', fontWeight: 'bold' }}
            >
                {text.substring(matchIndex, endIndex)}
            </Typography>
        );
        lastIndex = endIndex;
        i = endIndex - 1;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
};


// ================ Main Component ================
export const ChannelCard = ({ 
    channelName, 
    displayName,
    status = 'unknown',
    description,
    lastUpdated,
    role,
    searchText,
    isActive,
    group
}: ChannelCardProps) => {
    const [streamKeyDialogOpen, setStreamKeyDialogOpen] = useState(false);
    const [showCopySnackbar, setShowCopySnackbar] = useState(false);
    const { openChannelEditDialog } = useChannelEdit();
    const { refreshChannel } = useChannels();

    const handleCopyChannelName = async () => {
        await navigator.clipboard.writeText(channelName);
        setShowCopySnackbar(true);
    };

    const handleOpenStreamKey = () => {
        setStreamKeyDialogOpen(true);
    };

    const handleRefresh = () => {
        refreshChannel(channelName);
    };

    const handleEdit = () => {
        const channelConfig: ChannelConfig = {
            channelName,
            displayName,
            group,
            description,
            role,
            isActive
        };
        openChannelEditDialog(channelConfig);
    };

    return (
        <Card>
            <CardContent>
                <CardLayout
                    displayName={highlightText(displayName, searchText)}
                    status={<StatusIndicator status={status} />}
                    openButton={<OpenButton twitchUrl={getTwitchChannelUrl(channelName)} />}
                    channelName={
                        <ChannelNameWithActions
                            channelName={channelName}
                            searchText={searchText}
                            onCopy={handleCopyChannelName}
                            onOpenStreamKey={handleOpenStreamKey}
                            onEdit={handleEdit}
                        />
                    }
                    description={description && <Typography variant="caption">{description}</Typography>}
                    roleChip={role && <Chip label={role} size="small" color={getRoleChipColor(role)} />}
                    timestamp={<Typography variant="caption" color="text.secondary">{new Date(lastUpdated).toLocaleString()}</Typography>}
                    refreshButton={<RefreshButton onRefresh={handleRefresh} />}
                />
            </CardContent>
            <StreamKeyDialog 
                open={streamKeyDialogOpen} 
                onClose={() => setStreamKeyDialogOpen(false)} 
                channelName={channelName} 
            />
            <Snackbar
                open={showCopySnackbar}
                autoHideDuration={2000}
                onClose={() => setShowCopySnackbar(false)}
                message={`${channelName} copied to clipboard`}
            />
        </Card>
    );
}; 