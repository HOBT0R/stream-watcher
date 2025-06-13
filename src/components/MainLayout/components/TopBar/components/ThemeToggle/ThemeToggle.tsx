import React from 'react';
import { Switch, Box } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../../../../../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LightMode sx={{ color: isDarkMode ? 'action.disabled' : 'secondary.main' }} />
      <Switch
        color="success"
        checked={isDarkMode}
        onChange={toggleTheme}
        slotProps={{ input: { 'aria-label': 'theme switch' } }}
      />
      <DarkMode sx={{ color: isDarkMode ? 'secondary.main' : 'action.disabled' }} />
    </Box>
  );
};

export default ThemeToggle; 