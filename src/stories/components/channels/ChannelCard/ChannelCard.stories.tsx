import type { Meta, StoryObj, Decorator, StoryContext } from '@storybook/react-vite';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { http, HttpResponse } from 'msw';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ChannelCard, ChannelCardProps } from '@/components/MainLayout/components/ChannelDashboard/components/ChannelGroup/components/ChannelCard/ChannelCard';
import { ChannelEditProvider } from '@/contexts/ChannelEditContext';
import { ChannelProvider, useChannels } from '@/contexts/ChannelContext';
import { VideoProvider } from '@/contexts/VideoContext';
import { ChannelConfig } from '@/types/schema';

/**
 * Story-specific wrapper to connect ChannelCard to the ChannelContext
 */
const StatefulChannelCard = (props: ChannelCardProps) => {
  const { channelStates } = useChannels();
  const channel = channelStates.find(c => c.channelName === props.channelName);

  if (!channel) {
    return <div>Channel '{props.channelName}' not found in provider.</div>;
  }

  return <ChannelCard {...props} {...channel} />;
};

// --- Constants for reusability ---

const commonArgs = {
  channelName: 'example_channel',
  displayName: 'Example Channel',
  role: 'runner',
  group: 'speedrun',
  isActive: true,
};

const commonDecorator: Decorator = (Story, context: StoryContext) => {
  const args = context.args as unknown as ChannelCardProps;
  const initialConfig: ChannelConfig[] = [{
    channelName: args.channelName,
    displayName: args.displayName,
    group: args.group,
    isActive: args.isActive,
    role: args.role,
  }];

  return (
    <ThemeProvider>
      <ChannelProvider initialChannels={initialConfig}>
        <ChannelEditProvider>
          <VideoProvider>
            <Story />
          </VideoProvider>
        </ChannelEditProvider>
      </ChannelProvider>
    </ThemeProvider>
  );
};

const defaultMswHandlers = [
  http.post('http://localhost:3000/api/v1/statuses', () => {
    return HttpResponse.json({
      channels: [{ channelName: 'mst3k', status: 'online' }]
    });
  }),
];

// --- Meta ---

const meta = {
  title: 'Components/Channels/ChannelCard',
  component: StatefulChannelCard,
  tags: ['autodocs'],
  args: commonArgs,
  argTypes: {
    channelName: { description: 'Twitch channel name', control: 'text' },
    displayName: { description: 'Display name for the channel (optional)', control: 'text' },
    status: { description: 'Current stream status', control: 'select', options: ['online', 'offline', 'unknown'] },
    description: { description: 'Channel description (optional)', control: 'text' },
    lastUpdated: { description: 'Last status update timestamp', control: 'date' },
    role: { description: 'Role of the channel', control: 'select', options: ['runner', 'commentator', 'host', 'tech'] },
    group: { description: 'Group the channel belongs to', control: 'text' },
    isActive: { description: 'Whether to actively monitor this channel', control: 'boolean' },
    searchText: { description: 'Text to highlight in channel name (optional)', control: 'text' },
  },
  parameters: {
    layout: 'centered',
    msw: { handlers: defaultMswHandlers },
    docs: {
      description: {
        component: 'Channel card displays stream status and provides quick actions for a Twitch channel.',
      },
    },
    viewport: { defaultViewport: 'desktop' },
    a11y: {
      config: { rules: [{ id: 'button-name', enabled: true }] },
    },
  },
  decorators: [commonDecorator],
} satisfies Meta<typeof StatefulChannelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = {
  args: {
    status: 'online',
    lastUpdated: new Date().toISOString(),
  },
};

let getCount = 0;


// Status variations
export const Online: Story = {
  args: { ...Default.args },
  parameters: {
    msw: {
      handlers: [
        http.post('http://localhost:3000/api/v1/statuses', () => {
          return HttpResponse.json({
            channels: [{ channelName: 'example_channel', status: 'online' }],
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const indicator = await canvas.findByTestId('CircleIcon');
      // Success Green
      expect(getComputedStyle(indicator).color).toBe('rgb(46, 125, 50)');
      const statusElement = canvasElement.querySelector('.MuiChip-label');
      expect(statusElement?.textContent).toBe('online');
    });
  },
};

export const Offline: Story = {
  args: { ...Default.args },
  parameters: {
    msw: {
      handlers: [
        http.post('http://localhost:3000/api/v1/statuses', () => {
          return HttpResponse.json({
            channels: [{ channelName: 'example_channel', status: 'offline' }],
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const indicator = await canvas.findByTestId('CircleIcon');
      // Default Disabled Grey
      expect(getComputedStyle(indicator).color).toBe('rgba(0, 0, 0, 0.38)');
      const statusElement = canvasElement.querySelector('.MuiChip-label');
      expect(statusElement?.textContent).toBe('offline');
    });
  },
};

export const Unknown: Story = {
  args: { ...Default.args },
  parameters: {
    msw: {
      handlers: [
        http.post('http://localhost:3000/api/v1/statuses', () => {
          return HttpResponse.json({
            channels: [{ channelName: 'example_channel', status: 'unknown' }],
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const indicator = await canvas.findByTestId('CircleIcon');
      // Warning Orange
      expect(getComputedStyle(indicator).color).toBe('rgb(237, 108, 2)');
      const statusElement = canvasElement.querySelector('.MuiChip-label');
      expect(statusElement?.textContent).toBe('unknown');
    });
  },
};

export const WithRefresh: Story = {
  args: {
    status: 'unknown',
    lastUpdated: new Date().toISOString(),
  },
  parameters: {
    msw: {
      handlers: [
        http.post('http://localhost:3000/api/v1/statuses', () => {
          console.log('statuses has been called');
          getCount++;
          const status = getCount === 1 ? 'unknown' : 'online';
          return HttpResponse.json({
            channels: [{ channelName: 'example_channel', status: status }],
          });
        }),
      ],
    },
  },
  decorators: [
    (Story, context) => {
      getCount = 0;
      return commonDecorator(Story, context);
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial "unknown" status (orange)', async () => {
      await waitFor(async () => {
        const indicator = await canvas.findByTestId('CircleIcon');
        expect(getComputedStyle(indicator).color).toBe('rgb(237, 108, 2)');
      });
    });
    console.log('step 2');
    await step('Click refresh button', async () => {
      const button = await canvas.getByRole('button', { name: /Refresh Channel Status/i });
      await userEvent.click(button);
    });

    await step('Verify updated "online" status (green)', async () => {
      console.log('step 3a');
      await waitFor(async () => {
        const indicator = await canvas.findByTestId('CircleIcon');
        expect(getComputedStyle(indicator).color).toBe('rgb(46, 125, 50)');
      });
    });

    await waitFor(async () => {
      const statusElement = canvasElement.querySelector('.MuiChip-label');
      expect(statusElement?.textContent).toBe('online');
    }, { timeout: 5000 });
  },
};

export const Playing: Story = {
  args: {
    ...Default.args,
    status: 'online',
  },
  parameters: {
    msw: {
      handlers: [
        http.post('http://localhost:3000/api/v1/statuses', () => {
          return HttpResponse.json({
            channels: [{ channelName: 'example_channel', status: 'online' }]
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    console.log('play has started');
    const canvas = within(canvasElement);

      await waitFor(async () => {
        const indicator = await canvas.findByTestId('CircleIcon');
        expect(getComputedStyle(indicator).color).toBe('rgb(46, 125, 50)');
      });
    const playButton = await canvas.findByRole('button', { name: /Play Stream/i });
    await userEvent.click(playButton);

    await waitFor(async () => {
      const stopButton = await canvas.findByRole('button', { name: /Stop Stream/i });
      expect(stopButton).toBeInTheDocument();
    });
  },
};

// Other variants
export const WithSearchHighlight: Story = { args: { ...Default.args, searchText: 'example' } };
export const WithDisplayName: Story = { args: { ...Default.args, displayName: 'Example Channel' } };
export const WithDescription: Story = { args: { ...Default.args, description: 'This is an example channel description' } };
export const Inactive: Story = { 
  args: { ...Default.args, isActive: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cardContent = canvas.queryByText('Example Channel');
    expect(cardContent).toBeNull();
  },
};

