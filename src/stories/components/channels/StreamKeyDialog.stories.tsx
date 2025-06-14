import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { StreamKeyDialog } from '../../../components/MainLayout/components/ChannelDashboard/components/ChannelGroup/components/ChannelCard/components/StreamKeyDialog/StreamKeyDialog';
import { http, HttpResponse } from 'msw';

// Get the API base URL from environment or use default
const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
  : '';

const meta = {
  title: 'Components/Channels/StreamKeyDialog',
  component: StreamKeyDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Dialog for viewing and copying stream keys.'
      }
    },
    msw: {
      handlers: []
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
    open: true,
    channelName: 'example_channel',
    onClose: () => console.log('Dialog closed')
  }
} satisfies Meta<typeof StreamKeyDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Dialog with stream key
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE_URL}/api/v1/getStreamKey`, () => {
          return HttpResponse.text('live_123456789_abcdefghijklmnopqrstuvwxyz', {
            headers: {
              'Content-Type': 'text/plain'
            }
          });
        })
      ]
    }
  }
};

// Loading state (infinite delay)
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE_URL}/api/v1/getStreamKey`, () => {
          return new Promise(() => {}); // Never resolves
        })
      ]
    }
  }
};

// Authentication required
export const AuthRequired: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE_URL}/api/v1/getStreamKey`, () => {
          return new HttpResponse(
            'https://id.twitch.tv/oauth2/authorize?client_id=your_client_id&redirect_uri=your_redirect_uri&response_type=code&scope=channel:read:stream_key',
            {
              status: 302,
              headers: {
                'Content-Type': 'text/plain'
              }
            }
          );
        })
      ]
    }
  }
};

// Error state
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE_URL}/api/v1/getStreamKey`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        })
      ]
    }
  }
}; 