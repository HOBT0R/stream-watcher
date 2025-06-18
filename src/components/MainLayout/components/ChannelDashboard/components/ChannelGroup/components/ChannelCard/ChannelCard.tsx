import { useState, useRef, useMemo } from 'react';
import { 
    Box,
    Card, CardContent, Typography, Chip, IconButton, 
    Tooltip, Link, Snackbar, Grid
} from '@mui/material';
import { 
    Key as KeyIcon, 
    OpenInNew as OpenInNewIcon, 
    ContentCopy as ContentCopyIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import type { ChannelState, ChannelConfig } from '@/types/schema';
import { StreamKeyDialog } from './components/StreamKeyDialog/StreamKeyDialog';
import { getTwitchChannelUrl } from '@/utils/twitch';
import { useChannelEdit } from '@/contexts/ChannelEditContext';
import { useChannels } from '@/contexts/ChannelContext';
import { useVideo } from '@/contexts/VideoContext';
import VideoPlayer from '@/components/VideoPlayer';
import { PlayButton } from './components/PlayButton';
import { StatusIndicator } from './components/StatusIndicator';
import { getStatusChipColor } from '@/utils/channelUtils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { highlightText } from '@/utils/textUtils';

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
    playButton,
    openButton,
    channelName,
    copyButton,
    streamKeyButton,
    editButton,
    description,
    statusChip,
    timestamp,
    refreshButton,
}: {
    displayName?: React.ReactNode;
    status: React.ReactNode;
    playButton: React.ReactNode;
    openButton: React.ReactNode;
    channelName: React.ReactNode;
    copyButton: React.ReactNode;
    streamKeyButton: React.ReactNode;
    editButton: React.ReactNode;
    description?: React.ReactNode;
    statusChip?: React.ReactNode;
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
        <Grid>
            <Grid container alignItems="center" justifyContent="space-between" size={12}>
                <Grid>
                    {channelName}
                </Grid>
                <Grid>
                    {copyButton}
                </Grid>
                <Grid>
                    {streamKeyButton}
                </Grid>
                <Grid>
                    {editButton}
                </Grid>
                <Grid>
                    {playButton}
                </Grid>
            </Grid>
        </Grid>

        {/* ── Row 3 ── */}
        <Grid>
            <Grid container justifyContent="space-between" alignItems="center" columnGap={1}>
                {/* left-most: description (if any) */}
                {description && (
                    <Grid>{description}</Grid>
                )}
            </Grid>
        </Grid>
        {/* ── Row 4 ── */}
        <Grid>
            <Grid container justifyContent="space-between" alignItems="center" columnGap={1}>
                {/* left-most: STATUS chip */}
                {<Grid>{statusChip}</Grid>}
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
        <IconButton data-testid="channel-card-refresh-button" size="small" onClick={onRefresh}>
            <RefreshIcon fontSize="small" />
        </IconButton>
    </Tooltip>
);


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
    const { addPlayingVideo, removePlayingVideo, playingVideos } = useVideo();

    const cardRef = useRef<HTMLDivElement>(null);
    const observerOptions = useMemo(() => ({
        rootMargin: '100px', // A little buffer
    }), []);
    const isIntersecting = useIntersectionObserver(cardRef, observerOptions);

    const isPlayingVideo = playingVideos.includes(channelName);
    const isLive = status === 'online';
    const canPlay = isLive || isPlayingVideo;
    
    const handleTogglePlay = () => {
        if (isPlayingVideo) {
            removePlayingVideo(channelName);
        } else if (isLive) {
            addPlayingVideo(channelName);
        }
    };

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
            isActive,
        };
        openChannelEditDialog(channelConfig);
    };

    const twitchUrl = getTwitchChannelUrl(channelName);

    return (
        <Card 
            ref={cardRef}
            sx={{ 
                minWidth: isPlayingVideo ? 400 : 275,
                transition: 'all 0.3s ease-in-out',
            }}
        >
            <CardContent>
                {isPlayingVideo && isIntersecting && (
                    <Box sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16 / 9',
                        minHeight: 300,
                        backgroundColor: 'black'
                    }}>
                        <VideoPlayer
                            channelName={channelName}
                            displayName={displayName || channelName}
                        />
                    </Box>
                )}
                <CardLayout
                    displayName={highlightText(displayName, searchText)}
                    status={<StatusIndicator status={status} />}
                    playButton={<PlayButton isPlaying={isPlayingVideo} onClick={handleTogglePlay} disabled={!canPlay} />}
                    openButton={<OpenButton twitchUrl={twitchUrl} />}
                    channelName={
                        <Typography 
                            variant="caption"
                            color="text.secondary"
                            onClick={handleCopyChannelName}
                            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        >
                            {highlightText(channelName, searchText)}
                        </Typography>
                    }
                    copyButton={<CopyButton onCopy={handleCopyChannelName} />}
                    streamKeyButton={<StreamKeyButton onOpenStreamKey={handleOpenStreamKey} />}
                    editButton={<EditButton onEdit={handleEdit} />}
                    description={description && <Typography variant="caption">{description}</Typography>}
                    statusChip={<Chip label={status} size='small' color={getStatusChipColor(status)} />}
                    timestamp={<Typography variant="caption" color="text.secondary">{new Date(lastUpdated).toLocaleTimeString()}</Typography>}
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