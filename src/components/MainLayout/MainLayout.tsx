import React from 'react';
import { Box } from '@mui/material';
import { TopBar } from './components/TopBar';
import { ChannelDashboard } from './components/ChannelDashboard';
import { ChannelConfiguration } from './components/ChannelConfiguration';
import { useChannelManager } from '../../contexts/ChannelContext';
import { ChannelEditProvider } from '../../contexts/ChannelEditContext';

interface MainLayoutProps {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

export const MainLayout = ({ activeTab, setActiveTab }: MainLayoutProps) => {
  const { 
    channels,
    handleAddChannel,
    handleUpdateChannel,
    handleDeleteChannel,
    handleImport,
    handleExport,
   } = useChannelManager();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onImport={() => handleImport([])} 
        onExport={handleExport} 
      />
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        <ChannelEditProvider onAddChannel={handleAddChannel} onUpdateChannel={handleUpdateChannel}>
          {activeTab === 0 && <ChannelDashboard />}
          {activeTab === 1 && (
            <ChannelConfiguration
              channels={channels}
              onDeleteChannel={handleDeleteChannel}
            />
          )}
        </ChannelEditProvider>
      </Box>
    </Box>
  );
};

export default MainLayout; 