import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ChannelDashboard } from '../../../components/MainLayout/components/ChannelDashboard';
import { ChannelProvider } from '../../../contexts/ChannelContext';

const meta = {
  title: 'Pages/Dashboard',
  component: ChannelDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main dashboard page showing all channel statuses.'
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
  ]
} satisfies Meta<typeof ChannelDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Empty state
export const Empty: Story = {};

// With channels
export const WithChannels: Story = {
  parameters: {
    channelContext: {
      channels: [
        {
          channelName: 'example_runner',
          displayName: 'Example Runner',
          group: 'speedrun',
          role: 'runner',
          isActive: true,
          status: 'online',
          lastUpdated: new Date().toISOString()
        },
        {
          channelName: 'example_commentator',
          displayName: 'Example Commentator',
          group: 'speedrun',
          role: 'commentator',
          isActive: true,
          status: 'offline',
          lastUpdated: new Date().toISOString()
        }
      ]
    }
  }
};

// Loading state
export const Loading: Story = {
  parameters: {
    channelContext: {
      isLoading: true
    }
  }
};

// Error state
export const ErrorState: Story = {
  parameters: {
    channelContext: {
      error: new Error('Failed to fetch channel status')
    }
  }
};

// Mobile view
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    channelContext: {
      channels: [
        {
          channelName: 'example_runner',
          displayName: 'Example Runner',
          group: 'speedrun',
          role: 'runner',
          isActive: true,
          status: 'online',
          lastUpdated: new Date().toISOString()
        }
      ]
    }
  }
}; 