import React, { useState } from 'react';
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Select,
    Stack, Switch, TextField, Typography, IconButton, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ChannelConfig, ChannelRole } from '../../../../types/schema';

interface ChannelFormData extends Omit<ChannelConfig, 'channelName' | 'role'> {
    channelName: string;
    role: ChannelRole | '';
}

export interface ChannelConfigurationProps {
    channels: ChannelConfig[];
    onAddChannel: (channel: ChannelConfig) => void;
    onUpdateChannel: (channelName: string, updates: Partial<ChannelConfig>) => void;
    onDeleteChannel: (channelName: string) => void;
}

const defaultFormData: ChannelFormData = {
    channelName: '',
    displayName: '',
    group: '',
    description: '',
    role: '',
    isActive: true
};

export const ChannelConfiguration = ({ 
    channels, 
    onAddChannel, 
    onUpdateChannel, 
    onDeleteChannel 
}: ChannelConfigurationProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);
    const [formData, setFormData] = useState<ChannelFormData>(defaultFormData);

    const handleOpen = (channel: ChannelConfig | null = null) => {
        if (channel) {
            setEditingChannel(channel);
            setFormData({ ...channel, role: channel.role || '' });
        } else {
            setEditingChannel(null);
            setFormData(defaultFormData);
        }
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
        setEditingChannel(null);
        setFormData(defaultFormData);
    };

    const handleSave = () => {
        const submissionData: ChannelConfig = {
            ...formData,
            role: formData.role || undefined
        };

        if (editingChannel) {
            onUpdateChannel(editingChannel.channelName, submissionData);
        } else {
            onAddChannel(submissionData);
        }
        handleClose();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Channel Configuration</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Add Channel
                </Button>
            </Box>

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
                                    <IconButton aria-label="edit" onClick={() => handleOpen(channel)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton aria-label="delete" onClick={() => onDeleteChannel(channel.channelName)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleClose}>
                <DialogTitle>{editingChannel ? 'Edit Channel' : 'Add Channel'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Channel Name"
                            value={formData.channelName}
                            onChange={(e) => setFormData(prev => ({ ...prev, channelName: e.target.value }))}
                            disabled={!!editingChannel}
                        />
                        <TextField
                            label="Display Name"
                            value={formData.displayName}
                            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        />
                        <TextField
                            label="Group"
                            value={formData.group}
                            onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as ChannelRole | '' }))}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                <MenuItem value="runner">Runner</MenuItem>
                                <MenuItem value="commentator">Commentator</MenuItem>
                                <MenuItem value="host">Host</MenuItem>
                                <MenuItem value="tech">Tech</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            multiline
                            rows={3}
                        />
                        <FormControl fullWidth>
                            <Typography component="label">
                                Active
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                />
                            </Typography>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 