import React from 'react';
import { Box } from '@mui/material';
import { TopBar } from './components/TopBar';
import { ChannelDashboard } from './components/ChannelDashboard';
import { ChannelConfiguration } from './components/ChannelConfiguration';
import { useChannels } from '../../contexts/ChannelContext';
import { ChannelEditProvider } from '../../contexts/ChannelEditContext';

interface MainLayoutProps {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

export const MainLayout = ({ activeTab, setActiveTab }: MainLayoutProps) => {
  const { importChannels, exportChannels } = useChannels();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onImport={() => importChannels([])} 
        onExport={exportChannels} 
      />
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        <ChannelEditProvider>
          {activeTab === 0 && <ChannelDashboard />}
          {activeTab === 1 && <ChannelConfiguration />}
        </ChannelEditProvider>
      </Box>
    </Box>
  );
};

export default MainLayout; 