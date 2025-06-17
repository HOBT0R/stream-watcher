import { useState } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '@/theme';
import { ChannelProvider } from '@/contexts/ChannelContext';
import { ChannelFilterProvider } from '@/contexts/ChannelFilterContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MainLayout } from '@/components/MainLayout';
import { VideoProvider } from '@/contexts/VideoContext';

const App = () => {
    const { isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState(0);

    const theme = getAppTheme(isDarkMode);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ChannelProvider>
                <VideoProvider>
                    <ChannelFilterProvider>
                        <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} />
                    </ChannelFilterProvider>
                </VideoProvider>
            </ChannelProvider>
        </ThemeProvider>
    );
};

export default App;
