import React from 'react';
import { Box } from '@mui/material';
import { TopBar } from './components/TopBar';
import { ChannelDashboard } from './components/ChannelDashboard';
import { ChannelConfiguration } from './components/ChannelConfiguration';
import { useChannelManager } from '../../contexts/ChannelContext';

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
        {activeTab === 0 && <ChannelDashboard />}
        {activeTab === 1 && (
          <ChannelConfiguration
            channels={channels}
            onAddChannel={handleAddChannel}
            onUpdateChannel={handleUpdateChannel}
            onDeleteChannel={handleDeleteChannel}
          />
        )}
      </Box>
    </Box>
  );
};

export default MainLayout; 