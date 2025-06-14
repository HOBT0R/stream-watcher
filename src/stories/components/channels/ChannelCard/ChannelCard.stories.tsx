import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { ChannelCard } from '../../../../components/MainLayout/components/ChannelDashboard/components/ChannelGroup/components/ChannelCard/ChannelCard';
import { ChannelEditProvider } from '../../../../contexts/ChannelEditContext';
import { ChannelProvider } from '../../../../contexts/ChannelContext';

/**
 * `ChannelCard` displays stream status and provides quick actions for a Twitch channel.
 * 
 * @component
 * @example
 * ```tsx
 * <ChannelCard
 *   channelName="example"
 *   status="online"
 *   lastUpdated="2024-02-20T12:00:00Z"
 *   role="runner"
 *   group="speedrun"
 *   isActive={true}
 * />
 * ```
 * 
 * @accessibility
 * - Supports keyboard navigation
 * - ARIA labels for interactive elements
 * - High contrast theme support
 * - Screen reader announcements for status changes
 * 
 * @visualTesting
 * - Theme variations (light/dark)
 * - Status states (online/offline/unknown)
 * - Role variations
 * - Search text highlighting
 * - Loading states
 * - Error states
 */

const meta = {
  title: 'Components/Channels/ChannelCard',
  component: ChannelCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Channel card displays stream status and provides quick actions for a Twitch channel.'
      }
    },
    viewport: {
      defaultViewport: 'desktop'
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'button-name',
            enabled: true
          }
        ]
      }
    }
  },
  decorators: [
    (Story) => (
        <ThemeProvider>
            <ChannelProvider>
                <ChannelEditProvider>
                    <Story />
                </ChannelEditProvider>
            </ChannelProvider>
        </ThemeProvider>
    )
  ],
  args: {
    channelName: 'example_channel',
    displayName: 'Example Channel',
    status: 'online',
    lastUpdated: new Date().toISOString(),
    role: 'runner',
    group: 'speedrun',
    isActive: true,
  },
  argTypes: {
    channelName: {
      description: 'Twitch channel name',
      control: 'text'
    },
    displayName: {
      description: 'Display name for the channel (optional)',
      control: 'text'
    },
    status: {
      description: 'Current stream status',
      control: 'select',
      options: ['online', 'offline', 'unknown']
    },
    description: {
      description: 'Channel description (optional)',
      control: 'text'
    },
    lastUpdated: {
      description: 'Last status update timestamp',
      control: 'date'
    },
    role: {
      description: 'Role of the channel',
      control: 'select',
      options: ['runner', 'commentator', 'host', 'tech']
    },
    group: {
      description: 'Group the channel belongs to',
      control: 'text'
    },
    isActive: {
      description: 'Whether to actively monitor this channel',
      control: 'boolean'
    },
    searchText: {
      description: 'Text to highlight in channel name (optional)',
      control: 'text'
    }
  }
} satisfies Meta<typeof ChannelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base story
export const Default: Story = {
  args: {
    channelName: 'example_channel',
    status: 'online',
    lastUpdated: new Date().toISOString(),
    role: 'runner',
    group: 'speedrun',
    isActive: true
  }
};

// Online state
export const Online: Story = {
  args: {
    ...Default.args,
    status: 'online'
  }
};

// Offline state
export const Offline: Story = {
  args: {
    ...Default.args,
    status: 'offline'
  }
};

// Unknown state
export const Unknown: Story = {
  args: {
    ...Default.args,
    status: 'unknown'
  }
};

// Different roles
export const RunnerRole: Story = {
  args: {
    ...Default.args,
    role: 'runner'
  }
};

export const CommentatorRole: Story = {
  args: {
    ...Default.args,
    role: 'commentator'
  }
};

export const HostRole: Story = {
  args: {
    ...Default.args,
    role: 'host'
  }
};

export const TechRole: Story = {
  args: {
    ...Default.args,
    role: 'tech'
  }
};

// With search highlighting
export const WithSearchHighlight: Story = {
  args: {
    ...Default.args,
    channelName: 'example_channel',
    searchText: 'example'
  }
};

// With display name
export const WithDisplayName: Story = {
  args: {
    ...Default.args,
    channelName: 'example_channel',
    displayName: 'Example Channel'
  }
};

// With description
export const WithDescription: Story = {
  args: {
    ...Default.args,
    channelName: 'example_channel',
    description: 'This is an example channel description'
  }
};

// Inactive channel
export const Inactive: Story = {
  args: {
    ...Default.args,
    isActive: false
  }
};