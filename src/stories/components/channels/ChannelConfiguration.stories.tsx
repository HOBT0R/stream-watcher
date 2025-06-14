import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ChannelConfiguration } from '../../../components/MainLayout/components/ChannelConfiguration';
import { ChannelEditProvider } from '../../../contexts/ChannelEditContext';

const meta = {
  title: 'Components/Channels/ChannelConfiguration',
  component: ChannelConfiguration,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Configuration interface for managing channel settings.'
      }
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <ChannelEditProvider
          onAddChannel={(channel) => console.log('Add channel:', channel)}
          onUpdateChannel={(channelName, updates) => console.log('Update channel:', channelName, updates)}
        >
          <Story />
        </ChannelEditProvider>
      </ThemeProvider>
    )
  ],
  args: {
    channels: [
      {
        channelName: 'example_runner',
        displayName: 'Example Runner',
        group: 'Speedrun',
        role: 'runner',
        isActive: true
      },
      {
        channelName: 'example_commentator',
        displayName: 'Example Commentator',
        group: 'Speedrun',
        role: 'commentator',
        isActive: true
      }
    ],
    onDeleteChannel: (channelName) => console.log('Delete channel:', channelName)
  }
} satisfies Meta<typeof ChannelConfiguration>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default view with channels
export const Default: Story = {};

// Empty state
export const Empty: Story = {
  args: {
    channels: []
  }
}; 