import {
    Box, Button, IconButton, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Typography,
    Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useChannelEdit } from '../../../../contexts/ChannelEditContext';
import { useChannels } from '../../../../contexts/ChannelContext';
import { useState } from 'react';
import { ChannelConfig } from '../../../../types/schema';
import PollingIntervalConfiguration from './components/PollingIntervalConfiguration/PollingIntervalConfiguration';

type ImportedData = {
    channels?: unknown;
};

const isChannelConfig = (c: unknown): c is ChannelConfig => {
    return (
        typeof c === 'object' &&
        c !== null &&
        'channelName' in c &&
        typeof (c as ChannelConfig).channelName === 'string'
    );
};

export const ChannelConfiguration = () => {
    const { channels, deleteChannel, importChannels, exportChannels } = useChannels();
    const { openChannelEditDialog } = useChannelEdit();
    const [importError, setImportError] = useState<string | null>(null);

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                setImportError(null);
                const content = e.target?.result as string;
                const importedData = JSON.parse(content) as ImportedData;
                
                let channelData: unknown[];

                if (importedData.channels) {
                    if (Array.isArray(importedData.channels)) {
                        channelData = importedData.channels;
                    } else if (typeof importedData.channels === 'object' && importedData.channels !== null) {
                        channelData = Object.values(importedData.channels);
                    } else {
                        throw new Error('Invalid file format: "channels" is not an array or object.');
                    }
                } else if (Array.isArray(importedData)) {
                    channelData = importedData;
                } else {
                    throw new Error('Invalid file format: "channels" array or object not found.');
                }

                // More detailed validation could be added here (e.g., with Zod)
                const validatedChannels = channelData.filter(isChannelConfig);

                importChannels(validatedChannels);
            } catch (error) {
                console.error('Failed to parse or import channels:', error);
                setImportError(error instanceof Error ? error.message : 'An unknown error occurred.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Channel Configuration</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        component="label"
                        htmlFor="import-channels-file"
                    >
                        Import
                        <input
                            type="file"
                            id="import-channels-file"
                            hidden
                            accept=".json"
                            onChange={handleImport}
                        />
                    </Button>
                    <Button variant="contained" onClick={exportChannels}>
                        Export
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openChannelEditDialog(null)}>
                        Add Channel
                    </Button>
                </Box>
            </Box>

            <PollingIntervalConfiguration />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Channel Name</TableCell>
                            <TableCell>Display Name</TableCell>
                            <TableCell>Group</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Active</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {channels.map((channel) => (
                            <TableRow key={channel.channelName}>
                                <TableCell>{channel.channelName}</TableCell>
                                <TableCell>{channel.displayName}</TableCell>
                                <TableCell>{channel.group}</TableCell>
                                <TableCell>{channel.role}</TableCell>
                                <TableCell>{channel.isActive ? 'Yes' : 'No'}</TableCell>
                                <TableCell>
                                    <IconButton aria-label="edit" onClick={() => openChannelEditDialog(channel)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton aria-label="delete" onClick={() => deleteChannel(channel.channelName)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Snackbar
                open={!!importError}
                autoHideDuration={6000}
                onClose={() => setImportError(null)}
            >
                <Alert onClose={() => setImportError(null)} severity="error" sx={{ width: '100%' }}>
                    {importError}
                </Alert>
            </Snackbar>
        </Box>
    );
}; 