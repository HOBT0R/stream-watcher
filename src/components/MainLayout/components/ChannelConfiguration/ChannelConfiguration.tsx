import {
    Box, Button, IconButton, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ChannelConfig } from '../../../../types/schema';
import { useChannelEdit } from '../../../../contexts/ChannelEditContext';

export interface ChannelConfigurationProps {
    channels: ChannelConfig[];
    onDeleteChannel: (channelName: string) => void;
}

export const ChannelConfiguration = ({ 
    channels, 
    onDeleteChannel 
}: ChannelConfigurationProps) => {
    const { openChannelEditDialog } = useChannelEdit();

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Channel Configuration</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => openChannelEditDialog(null)}>
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
                                    <IconButton aria-label="edit" onClick={() => openChannelEditDialog(channel)}>
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
        </Box>
    );
}; 