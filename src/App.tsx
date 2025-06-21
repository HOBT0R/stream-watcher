import { useState } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '@/theme';
import { ChannelProvider } from '@/contexts/ChannelContext';
import { ChannelFilterProvider } from '@/contexts/ChannelFilterContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { MainLayout } from '@/components/MainLayout';
import { VideoProvider } from '@/contexts/VideoContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { ApiProvider } from '@/contexts/ApiContext';


const AppContainer = () => {
    const { isDarkMode } = useTheme();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const skipLogin = import.meta.env.VITE_SKIP_LOGIN === 'true';

    const theme = getAppTheme(isDarkMode);

    if (!skipLogin && !user) {
        return <LoginPage />;
    }

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <ChannelProvider>
                <VideoProvider>
                    <ChannelFilterProvider>
                        <MainLayout 
                            activeTab={activeTab} 
                            setActiveTab={setActiveTab}
                            onLogout={logout} 
                        />
                    </ChannelFilterProvider>
                </VideoProvider>
            </ChannelProvider>
        </MuiThemeProvider>
    );
};

const App = () => (
    <AuthProvider>
        <ApiProvider>
            <ThemeProvider>
                <AppContainer />
            </ThemeProvider>
        </ApiProvider>
    </AuthProvider>
);

export default App;
