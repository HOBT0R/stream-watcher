import { useState } from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton, Tooltip, Link, Snackbar } from '@mui/material';
import { Circle as CircleIcon, Key as KeyIcon, OpenInNew as OpenInNewIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import type { ChannelState } from '../../../../../../../types/schema';
import { StreamKeyDialog } from './ChannelCard/components/StreamKeyDialog';
import { getTwitchChannelUrl } from '../../../../../../../utils/twitch';

export interface ChannelCardProps extends ChannelState {
    searchText?: string;
}

export const ChannelCard = ({ 
    channelName, 
    displayName,
    status = 'unknown', 
    group, 
    description,
    lastUpdated,
    role,
    searchText
}: ChannelCardProps) => {
    const [streamKeyDialogOpen, setStreamKeyDialogOpen] = useState(false);
    const [showCopySnackbar, setShowCopySnackbar] = useState(false);

    const getStatusColor = (status: ChannelState['status']) => {
        switch (status) {
            case 'online':
                return 'success.main';
            case 'offline':
                return 'text.disabled';
            case 'unknown':
            default:
                return 'warning.main';
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

    const twitchUrl = getTwitchChannelUrl(channelName);

    const handleCopyChannelName = async () => {
        try {
            await navigator.clipboard.writeText(channelName);
            setShowCopySnackbar(true);
        } catch (err) {
            console.error('Failed to copy channel name:', err);
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

    return (
        <>
        <Card sx={{ 
            minWidth: 275, 
            maxWidth: 345,
            position: 'relative',
            '&:hover': {
                boxShadow: 6
            }
        }}>
            <CardContent>
                {/* Status Indicator and Name */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                    mb: 1 
                }}>
                    <Box>
                            {displayName && (
                        <Typography variant="h6" component="div">
                                    {highlightText(displayName, searchText)}
                            </Typography>
                        )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography 
                                    variant={displayName ? "caption" : "h6"} 
                                    color={displayName ? "text.secondary" : "text.primary"}
                                    onClick={handleCopyChannelName}
                                    sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': {
                                            color: 'primary.main'
                                        },
                                        lineHeight: 'normal'
                                    }}
                                >
                                    {highlightText(channelName, searchText)}
                                </Typography>
                                <Tooltip title="Copy Channel Name">
                                    <IconButton 
                                        size="small"
                                        onClick={handleCopyChannelName}
                                        sx={{ 
                                            color: 'text.secondary',
                                            '&:hover': {
                                                color: 'primary.main'
                                            },
                                            mt: '-4px'
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Open Twitch Channel">
                                    <Link 
                                        href={twitchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{ mt: '2px' }}
                                    >
                                        <OpenInNewIcon 
                                            fontSize="small" 
                                            sx={{ 
                                                color: 'text.secondary',
                                                '&:hover': {
                                                    color: 'primary.main'
                                                }
                                            }} 
                                        />
                                    </Link>
                                </Tooltip>
                                <Tooltip title="Get Stream Key">
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setStreamKeyDialogOpen(true)}
                                        sx={{ 
                                            color: 'text.secondary',
                                            '&:hover': {
                                                color: 'primary.main'
                                            },
                                            mt: '-2px'
                                        }}
                                    >
                                        <KeyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                    </Box>
                        <CircleIcon 
                            sx={{ 
                                color: getStatusColor(status),
                                fontSize: '1rem'
                            }} 
                        />
                </Box>

                {/* Description */}
                {description && (
                    <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: 1.5 }}
                    >
                            {highlightText(description, searchText)}
                    </Typography>
                )}

                    {/* Group Tag and Role Tag */}
                    <Box sx={{ 
                        mt: 2, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: 1
                    }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                                label={highlightText(group, searchText)}
                        size="small"
                        sx={{ borderRadius: 1 }}
                    />
                            {role && (
                                <Chip
                                    label={highlightText(role.charAt(0).toUpperCase() + role.slice(1), searchText)}
                                    size="small"
                                    color={getRoleChipColor(role)}
                                    sx={{ borderRadius: 1 }}
                                />
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(lastUpdated).toLocaleTimeString()}
                        </Typography>
                </Box>
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
                message="Channel name copied to clipboard"
            />
        </>
    );
}; 