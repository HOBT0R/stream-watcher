import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ChannelConfig } from '../types/schema';
import { ChannelEditDialog } from '../components/MainLayout/components/ChannelConfiguration/ChannelEditDialog';
import { useChannels } from './ChannelContext';

interface ChannelEditContextType {
    openChannelEditDialog: (channel: ChannelConfig | null) => void;
}

const ChannelEditContext = createContext<ChannelEditContextType | undefined>(undefined);

export const useChannelEdit = () => {
    const context = useContext(ChannelEditContext);
    if (!context) {
        throw new Error('useChannelEdit must be used within a ChannelEditProvider');
    }
    return context;
};

interface ChannelEditProviderProps {
    children: ReactNode;
}

export const ChannelEditProvider = ({ children }: ChannelEditProviderProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);
    const { addChannel, updateChannel } = useChannels();

    const openChannelEditDialog = useCallback((channel: ChannelConfig | null) => {
        setEditingChannel(channel);
        setDialogOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setDialogOpen(false);
        setEditingChannel(null);
    }, []);

    const handleSave = useCallback((channelData: ChannelConfig) => {
        if (editingChannel) {
            updateChannel(editingChannel.channelName, channelData);
        } else {
            addChannel(channelData);
        }
        handleClose();
    }, [editingChannel, addChannel, updateChannel, handleClose]);

    return (
        <ChannelEditContext.Provider value={{ openChannelEditDialog }}>
            {children}
            <ChannelEditDialog
                open={dialogOpen}
                onClose={handleClose}
                onSave={handleSave}
                channelToEdit={editingChannel}
            />
        </ChannelEditContext.Provider>
    );
}; 