import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    InputAdornment,
    TextField,
    Link
} from '@mui/material';
import { ContentCopy as CopyIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { channelService } from '../../../../../../../../../services/api/channelService';
import type { StreamKeyResponse } from '../../../../../../../../../services/api/channelService';

interface StreamKeyDialogProps {
    open: boolean;
    onClose: () => void;
    channelName: string;
}

export const StreamKeyDialog = ({ open, onClose, channelName }: StreamKeyDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamKey, setStreamKey] = useState<StreamKeyResponse | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [authUrl, setAuthUrl] = useState<string | null>(null);

    const handleGetStreamKey = useCallback(async () => {
        setLoading(true);
        setError(null);
        setAuthUrl(null);
        try {
            const key = await channelService.getStreamKey(channelName);
            setStreamKey(key);
        } catch (err: any) {
            if ('authUrl' in err) {
                setAuthUrl(err.authUrl);
                setError('Authentication required');
            } else {
                setError(err?.message || 'Failed to get stream key');
            }
        } finally {
            setLoading(false);
        }
    }, [channelName]);

    const handleCopyKey = async () => {
        if (streamKey?.streamKey) {
            await navigator.clipboard.writeText(streamKey.streamKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setStreamKey(null);
            setError(null);
            setShowKey(false);
            setCopied(false);
            setAuthUrl(null);
            handleGetStreamKey();
        }
    }, [open, handleGetStreamKey]);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Stream Key - {channelName}</DialogTitle>
            <DialogContent>
                <Box sx={{ py: 2 }}>
                    {error === 'Authentication required' && authUrl ? (
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                You need to authenticate with Twitch to get your stream key.
                            </Typography>
                            <Link 
                                href={authUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ 
                                    display: 'block',
                                    textAlign: 'center',
                                    mt: 2
                                }}
                            >
                                <Button
                                    variant="contained"
                                    fullWidth
                                >
                                    Authenticate with Twitch
                                </Button>
                            </Link>
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                            <Button 
                                size="small" 
                                onClick={handleGetStreamKey}
                                sx={{ ml: 2 }}
                            >
                                Try Again
                            </Button>
                        </Alert>
                    ) : loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary">
                                Getting stream key...
                            </Typography>
                        </Box>
                    ) : streamKey ? (
                        <Box>
                            <TextField
                                label="Stream Key"
                                value={streamKey.streamKey}
                                fullWidth
                                type={showKey ? 'text' : 'password'}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowKey(!showKey)}
                                                edge="end"
                                            >
                                                {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                            <IconButton
                                                onClick={handleCopyKey}
                                                edge="end"
                                            >
                                                <CopyIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {copied && (
                                <Alert severity="success" sx={{ mt: 1 }}>
                                    Stream key copied to clipboard!
                                </Alert>
                            )}
                        </Box>
                    ) : null}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}; 