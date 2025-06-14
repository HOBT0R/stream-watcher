import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ChannelGroup } from '../../../components/MainLayout/components/ChannelDashboard/components/ChannelGroup';
import { ChannelProvider } from '../../../contexts/ChannelContext';
import { ChannelFilterProvider } from '../../../contexts/ChannelFilterContext';
import { ChannelEditProvider } from '../../../contexts/ChannelEditContext';

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
        <ChannelProvider>
          <ChannelFilterProvider>
            <ChannelEditProvider>
                <Story />
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

// Default expanded group
export const Default: Story = {};

// Collapsed group
export const Collapsed: Story = {
  args: {
    defaultExpanded: false
  }
};

// To test search highlighting, you would need to set the value in the ChannelFilterProvider.
// This story is a placeholder for a more advanced setup.
export const WithSearch: Story = {
    args: {}
}; 