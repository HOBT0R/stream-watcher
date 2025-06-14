import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ChannelGroup } from '../../../components/MainLayout/components/ChannelDashboard/components/ChannelGroup';
import { ChannelProvider } from '../../../contexts/ChannelContext';

const meta = {
  title: 'Components/Channels/ChannelGroup',
  component: ChannelGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Groups channels together with collapsible sections.'
      }
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <ChannelProvider pollingIntervalSeconds={30}>
          <Story />
        </ChannelProvider>
      </ThemeProvider>
    )
  ],
  args: {
    groupName: 'Speedrun',
    defaultExpanded: true,
    channels: [
      {
        channelName: 'runner1',
        displayName: 'Speed Runner 1',
        status: 'online',
        lastUpdated: new Date().toISOString(),
        role: 'runner',
        group: 'Speedrun',
        isActive: true
      },
      {
        channelName: 'commentator1',
        displayName: 'Commentator 1',
        status: 'offline',
        lastUpdated: new Date().toISOString(),
        role: 'commentator',
        group: 'Speedrun',
        isActive: true
      }
    ]
  }
} satisfies Meta<typeof ChannelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default expanded group
export const Default: Story = {};

// Collapsed group
export const Collapsed: Story = {
  args: {
    defaultExpanded: false
  }
};

// With search highlight
export const WithSearch: Story = {
  args: {
    searchText: 'runner'
  }
}; 