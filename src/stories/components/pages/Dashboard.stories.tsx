import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ChannelDashboard } from '../../../components/MainLayout/components/ChannelDashboard';
import { ChannelProvider } from '../../../contexts/ChannelContext';
import { ChannelEditProvider } from '../../../contexts/ChannelEditContext';
import { ChannelFilterProvider } from '../../../contexts/ChannelFilterContext';

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
        <ChannelProvider>
          <ChannelFilterProvider>
            <ChannelEditProvider>
              <Story />
            </ChannelEditProvider>
          </ChannelFilterProvider>
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
export const WithChannels: Story = {};

// Loading state
export const Loading: Story = {};

// Error state
export const ErrorState: Story = {};

// Mobile view
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}; 