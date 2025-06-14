import { useState } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from './theme';
import { ChannelProvider } from './contexts/ChannelContext';
import { ChannelFilterProvider } from './contexts/ChannelFilterContext';
import { useTheme } from './contexts/ThemeContext';
import { MainLayout } from './components/MainLayout';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppConfig } from './types/schema';
import defaultConfig from './config/defaults.json';

const App = () => {
    const { isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [config] = useLocalStorage<AppConfig>('stream-watcher-config', defaultConfig);

    const theme = getAppTheme(isDarkMode);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ChannelProvider 
                pollingIntervalSeconds={config.preferences.pollInterval}
            >
                <ChannelFilterProvider>
                    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} />
                </ChannelFilterProvider>
            </ChannelProvider>
        </ThemeProvider>
    );
};

export default App;
