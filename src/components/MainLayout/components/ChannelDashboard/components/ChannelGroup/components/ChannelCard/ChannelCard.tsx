import { useState } from 'react';
import { 
    Card, CardContent, Typography, Chip, IconButton, 
    Tooltip, Link, Snackbar, Grid 
} from '@mui/material';
import { 
    Circle as CircleIcon, 
    Key as KeyIcon, 
    OpenInNew as OpenInNewIcon, 
    ContentCopy as ContentCopyIcon 
} from '@mui/icons-material';
import type { ChannelState } from '../../../../../../../../types/schema';
import { StreamKeyDialog } from './components/StreamKeyDialog/StreamKeyDialog';
import { getTwitchChannelUrl } from '../../../../../../../../utils/twitch';

// ================ Types ================
export interface ChannelCardProps extends ChannelState {
    searchText?: string;
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
}: {
    displayName?: React.ReactNode;
    status: React.ReactNode;
    openButton: React.ReactNode;
    channelName: React.ReactNode;
    description?: React.ReactNode;
    roleChip?: React.ReactNode;
    timestamp: React.ReactNode;
}) => (
    <Grid container direction="column" rowSpacing={1}>
        {/* ── Row 1 ── */}
        <Grid>
            <Grid container alignItems="flex-start" justifyContent="space-between">
                <Grid  size={{ xs: 10 }}>{displayName}</Grid>
                <Grid  size={{ xs: 2 }}>{status} {openButton}</Grid>
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
                <Grid sx={{ marginLeft: 'auto' }}>{timestamp}</Grid>
            </Grid>
        </Grid>
    </Grid>
);


// ================ Subcomponents ================

const ChannelNameWithActions = ({
    channelName,
    searchText,
    onCopy,
    onOpenStreamKey
}: {
    channelName: string;
    searchText?: string;
    onCopy: () => void;
    onOpenStreamKey: () => void;
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
    searchText
}: ChannelCardProps) => {
    const [streamKeyDialogOpen, setStreamKeyDialogOpen] = useState(false);
    const [showCopySnackbar, setShowCopySnackbar] = useState(false);

    const handleCopyChannelName = async () => {
        await navigator.clipboard.writeText(channelName);
        setShowCopySnackbar(true);
    };

    return (
        <>
            <Card sx={{ 
                minWidth: 275, 
                maxWidth: 600,
                position: 'relative',
                '&:hover': { boxShadow: 6 }
            }}>
                <CardContent>
                    <CardLayout
                        displayName={
                            displayName && (
                                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                                    {highlightText(displayName, searchText)}
                                </Typography>
                            )
                        }
                        status={<StatusIndicator status={status} />}
                        openButton={<OpenButton twitchUrl={getTwitchChannelUrl(channelName)} />}
                        channelName={
                            <ChannelNameWithActions
                                channelName={channelName}
                                searchText={searchText}
                                onCopy={handleCopyChannelName}
                                onOpenStreamKey={() => setStreamKeyDialogOpen(true)}
                            />
                        }
                        description={
                            description && (
                                <Typography variant="body2" color="text.secondary">
                                    {highlightText(description, searchText)}
                                </Typography>
                            )
                        }
                        roleChip={
                            role && (
                                <Chip
                                    label={highlightText(
                                        role.charAt(0).toUpperCase() + role.slice(1),
                                        searchText
                                    )}
                                    size="small"
                                    color={getRoleChipColor(role)}
                                />
                            )
                        }
                        timestamp={
                            <Typography variant="caption" color="text.secondary">
                                {new Date(lastUpdated).toLocaleTimeString()}
                            </Typography>
                        }
                    />
                </CardContent>
            </Card>

            <StreamKeyDialog
                open={streamKeyDialogOpen}
                onClose={() => setStreamKeyDialogOpen(false)}
                channelName={channelName}
            />

            <Snackbar
                open={showCopySnackbar}
                autoHideDuration={2000}
                onClose={() => setShowCopySnackbar(false)}
                message="Channel name copied"
            />
        </>
    );
}; 