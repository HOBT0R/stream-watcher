import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/MainLayout/components/TopBar/components/ThemeToggle/ThemeToggle';

const meta = {
  title: 'Core/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A toggle button that switches between light and dark themes.'
      }
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    )
  ]
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base story
export const Default: Story = {};

// Light theme
export const LightTheme: Story = {
  parameters: {
    backgrounds: {
      default: 'light'
    }
  }
};

// Dark theme
export const DarkTheme: Story = {
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}; 