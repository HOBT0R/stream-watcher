import { createContext, useContext, useState, ReactNode } from 'react';
import { ChannelConfig } from '../types/schema';
import { ChannelEditDialog } from '../components/MainLayout/components/ChannelConfiguration/ChannelEditDialog';

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
    onAddChannel: (channel: ChannelConfig) => void;
    onUpdateChannel: (channelName: string, updates: Partial<ChannelConfig>) => void;
}

export const ChannelEditProvider = ({ children, onAddChannel, onUpdateChannel }: ChannelEditProviderProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);

    const openChannelEditDialog = (channel: ChannelConfig | null) => {
        setEditingChannel(channel);
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
        setEditingChannel(null);
    };

    const handleSave = (channelData: ChannelConfig) => {
        if (editingChannel) {
            onUpdateChannel(editingChannel.channelName, channelData);
        } else {
            onAddChannel(channelData);
        }
        handleClose();
    };

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