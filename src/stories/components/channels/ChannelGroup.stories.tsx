import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ChannelGroup } from '@/components/MainLayout/components/ChannelDashboard/components/ChannelGroup';
import { ChannelProvider } from '@/contexts/ChannelContext';
import { ChannelFilterProvider, useChannelFilter } from '@/contexts/ChannelFilterContext';
import { ChannelEditProvider } from '@/contexts/ChannelEditContext';
import { VideoProvider } from '@/contexts/VideoContext';
import type { ChannelConfig } from '@/types/schema';

const multipleChannelsConfig: ChannelConfig[] = [
  { channelName: 'agdq', displayName: 'AGDQ', group: 'Speedrun', isActive: true, role: 'runner' },
  { channelName: 'esamarathon', displayName: 'ESA Marathon', group: 'Speedrun', isActive: true, role: 'runner' },
  { channelName: 'gamesdonequick', displayName: 'Games Done Quick', group: 'Speedrun', isActive: true, role: 'host' },
  { channelName: 'rpglimitbreak', displayName: 'RPG Limit Break', group: 'Speedrun', isActive: true, role: 'runner' },
  { channelName: 'frostyfaustings', displayName: 'Frosty Faustings', group: 'Speedrun', isActive: true, role: 'commentator' },
  { channelName: 'pacothetaco', displayName: 'PacoTheTaco', group: 'Speedrun', isActive: true, role: 'runner' },
];

const meta = {
  title: 'Components/Channels/ChannelGroup',
  component: ChannelGroup,
  parameters: {
    layout: 'fullscreen',
    msw: {
        handlers: [
            http.post('http://localhost:3000/api/v1/statuses', () => {
                return HttpResponse.json({
                    channels: [
                        { channelName: 'agdq', status: 'online' },
                        { channelName: 'esamarathon', status: 'online' },
                        { channelName: 'gamesdonequick', status: 'online' },
                        { channelName: 'rpglimitbreak', status: 'online' },
                        { channelName: 'pacothetaco', status: 'online' },
                        { channelName: 'frostyfaustings', status: 'offline' },
                    ]
                });
            })
        ]
    },
    docs: {
      description: {
        component: 'Groups channels together with collapsible sections.'
      }
    }
  },
  decorators: [
    (Story, { parameters }) => (
      <ThemeProvider>
        <ChannelProvider initialChannels={parameters.initialChannels || []}>
          <ChannelFilterProvider>
            <ChannelEditProvider>
              <VideoProvider>
                <Story />
              </VideoProvider>
            </ChannelEditProvider>
          </ChannelFilterProvider>
        </ChannelProvider>
      </ThemeProvider>
    )
  ],
  args: {
    groupName: 'Speedrun',
    defaultExpanded: true,
  }
} satisfies Meta<typeof ChannelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultExpanded: Story = {
  parameters: {
    initialChannels: multipleChannelsConfig,
  }
};

export const Collapsed: Story = {
  args: {
    defaultExpanded: false
  },
  parameters: {
    initialChannels: multipleChannelsConfig,
  }
};

const SearchDecorator: Decorator = (Story) => {
    const { setSearchText } = useChannelFilter();
    setSearchText('gdq');
    return <Story />;
}

export const WithSearch: Story = {
    parameters: {
        initialChannels: multipleChannelsConfig,
    },
    decorators: [SearchDecorator]
}; 