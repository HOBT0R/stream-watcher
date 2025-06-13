import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import ThemeToggle from './components/ThemeToggle';
import { NavButton } from '../../../NavButton';

export interface TopBarProps {
  activeTab: number;
  onTabChange: (event: React.MouseEvent<HTMLButtonElement>, newValue: number) => void;
  onImport: () => void;
  onExport: () => void;
}

export const TopBar = ({ activeTab, onTabChange, onImport, onExport }: TopBarProps) => {
  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Stream Watcher
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NavButton 
            isActive={activeTab === 0} 
            onClick={(e) => onTabChange(e, 0)}
            label="Dashboard" 
          />
          <NavButton 
            isActive={activeTab === 1} 
            onClick={(e) => onTabChange(e, 1)}
            label="Configuration" 
          />
          <Box sx={{ flexGrow: 1 }} />
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;