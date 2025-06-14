import { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button,
    FormControl, InputLabel, MenuItem, Select,
    Stack, Switch, TextField, Typography
} from '@mui/material';
import { ChannelConfig, ChannelRole } from '../../../../types/schema';

interface ChannelFormData extends Omit<ChannelConfig, 'channelName' | 'role'> {
    channelName: string;
    role: ChannelRole | '';
}

const defaultFormData: ChannelFormData = {
    channelName: '',
    displayName: '',
    group: '',
    description: '',
    role: '',
    isActive: true
};

export interface ChannelEditDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (channel: ChannelConfig) => void;
    channelToEdit: ChannelConfig | null;
}

export const ChannelEditDialog = ({ open, onClose, onSave, channelToEdit }: ChannelEditDialogProps) => {
    const [formData, setFormData] = useState<ChannelFormData>(defaultFormData);

    useEffect(() => {
        if (open) {
            if (channelToEdit) {
                setFormData({ ...channelToEdit, role: channelToEdit.role || '' });
            } else {
                setFormData(defaultFormData);
            }
        }
    }, [open, channelToEdit]);

    const handleSave = () => {
        const submissionData: ChannelConfig = {
            ...formData,
            role: formData.role || undefined
        };
        onSave(submissionData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{channelToEdit ? 'Edit Channel' : 'Add Channel'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Channel Name"
                        value={formData.channelName}
                        onChange={(e) => setFormData(prev => ({ ...prev, channelName: e.target.value }))}
                        disabled={!!channelToEdit}
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
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}; 