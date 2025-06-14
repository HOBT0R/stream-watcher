import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import TopBar from '../../../components/MainLayout/components/TopBar/TopBar';

const meta = {
  title: 'Layout/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main navigation bar with theme toggle and tab navigation.'
      }
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    )
  ],
  args: {
    activeTab: 0,
    onTabChange: (_e: React.SyntheticEvent, tab: number) => {
      console.log('Tab changed to:', tab);
    },
    onImport: () => {
      console.log('Import clicked');
    },
    onExport: () => {
      console.log('Export clicked');
    }
  }
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Dashboard tab active
export const DashboardTab: Story = {
  args: {
    activeTab: 0,
    onTabChange: (_e: React.SyntheticEvent, tab: number) => {
      console.log('Tab changed to:', tab);
    },
    onImport: () => {
      console.log('Import clicked');
    },
    onExport: () => {
      console.log('Export clicked');
    }
  }
};

// Configuration tab active
export const ConfigurationTab: Story = {
  args: {
    activeTab: 1,
    onTabChange: (_e: React.SyntheticEvent, tab: number) => {
      console.log('Tab changed to:', tab);
    },
    onImport: () => {
      console.log('Import clicked');
    },
    onExport: () => {
      console.log('Export clicked');
    }
  }
};

// Mobile view
export const Mobile: Story = {
  args: {
    activeTab: 0,
    onTabChange: (_e: React.SyntheticEvent, tab: number) => {
      console.log('Tab changed to:', tab);
    },
    onImport: () => {
      console.log('Import clicked');
    },
    onExport: () => {
      console.log('Export clicked');
    }
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}; 