import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ChannelConfiguration } from '../../../components/MainLayout/components/ChannelConfiguration';
import { ChannelEditProvider } from '../../../contexts/ChannelEditContext';
import { ChannelProvider } from '../../../contexts/ChannelContext';

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
        <ChannelProvider>
          <ChannelEditProvider>
            <Story />
          </ChannelEditProvider>
        </ChannelProvider>
      </ThemeProvider>
    )
  ],
  args: {}
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