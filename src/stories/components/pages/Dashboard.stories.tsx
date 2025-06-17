import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { MainLayout } from '@/components/MainLayout';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ChannelProvider } from '@/contexts/ChannelContext';
import { ChannelFilterProvider } from '@/contexts/ChannelFilterContext';
import { VideoProvider } from '@/contexts/VideoContext';
import { http, HttpResponse } from 'msw';
import type { ChannelConfig } from '@/types/schema';
import { getAppTheme } from '@/theme';

const StorybookThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { isDarkMode } = useTheme();
    const theme = getAppTheme(isDarkMode);
    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </MuiThemeProvider>
    );
};

const multipleChannelsConfig: ChannelConfig[] = [
    { channelName: 'agdq', displayName: 'AGDQ', group: 'Speedrun', isActive: true, role: 'runner' },
    { channelName: 'esamarathon', displayName: 'ESA Marathon', group: 'Speedrun', isActive: true, role: 'runner' },
    { channelName: 'gamesdonequick', displayName: 'Games Done Quick', group: 'Speedrun', isActive: true, role: 'host' },
    { channelName: 'rpglimitbreak', displayName: 'RPG Limit Break', group: 'Speedrun', isActive: true, role: 'runner' },
    { channelName: 'frostyfaustings', displayName: 'Frosty Faustings', group: 'Speedrun', isActive: true, role: 'commentator' },
    { channelName: 'pacothetaco', displayName: 'PacoTheTaco', group: 'Speedrun', isActive: true, role: 'runner' },
  ];

const meta: Meta<typeof MainLayout> = {
    title: 'Pages/Dashboard',
    component: MainLayout,
    decorators: [
        (Story, { parameters, args }) => {
            return (
                <ThemeProvider>
                    <StorybookThemeProvider>
                        <ChannelProvider initialChannels={parameters.initialChannels || []}>
                            <ChannelFilterProvider>
                                <VideoProvider>
                                    <Story {...args} />
                                </VideoProvider>
                            </ChannelFilterProvider>
                        </ChannelProvider>
                    </StorybookThemeProvider>
                </ThemeProvider>
            );
        },
    ],
    parameters: {
        layout: 'fullscreen',
        activeTab: 0,
        msw: {
            handlers: [
                http.post('http://localhost:3000/api/v1/statuses', () => {
                    return HttpResponse.json({ channels: [
                        { channelName: 'agdq', status: 'online' },
                        { channelName: 'esamarathon', status: 'online' },
                        { channelName: 'gamesdonequick', status: 'online' },
                        { channelName: 'rpglimitbreak', status: 'online' },
                        { channelName: 'pacothetaco', status: 'online' },
                        { channelName: 'frostyfaustings', status: 'offline' },
                    ] });
                })
            ]
        }
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    render: (args) => {
        const [activeTab, setActiveTab] = useState(0);
        return <MainLayout {...args} activeTab={activeTab} setActiveTab={setActiveTab} />;
    },
};

export const WithChannels: Story = {
    ...Empty,
    parameters: {
        initialChannels: multipleChannelsConfig,
    }
};

// Loading state
export const Loading: Story = {
    ...Empty,
    parameters: {
        initialChannels: multipleChannelsConfig,
    }
};

// Error state
export const ErrorState: Story = {
    ...Empty,
    parameters: {
        initialChannels: multipleChannelsConfig,
        }
};