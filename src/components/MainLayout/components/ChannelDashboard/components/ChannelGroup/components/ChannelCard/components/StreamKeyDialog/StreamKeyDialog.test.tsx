import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { StreamKeyDialog } from './StreamKeyDialog';
import { ThemeProvider } from '../../../../../../../../../../contexts/ThemeContext';
import { channelService } from '../../../../../../../../../../services/api/channelService';

vi.mock('../../../../../../../../../../services/api/channelService');

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  writable: true
});

describe('StreamKeyDialog', () => {
  const mockOnClose = vi.fn();
  const mockChannelName = 'test_channel';

  beforeEach(() => {
    vi.resetAllMocks();
    (channelService.getStreamKey as Mock).mockResolvedValue({ streamKey: 'live_12345_test' });
  });

  const renderComponent = () => {
    render(
      <ThemeProvider>
        <StreamKeyDialog open={true} onClose={mockOnClose} channelName={mockChannelName} />
      </ThemeProvider>
    );
  };

  it('shows a loading indicator while fetching the key', () => {
    (channelService.getStreamKey as Mock).mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Getting stream key...')).toBeInTheDocument();
  });

  it('displays the stream key on successful fetch', async () => {
    renderComponent();
    expect(await screen.findByDisplayValue('live_12345_test')).toBeInTheDocument();
  });

  it('displays an error message if the fetch fails', async () => {
    const errorMessage = 'Failed to fetch key';
    (channelService.getStreamKey as Mock).mockRejectedValue(new Error(errorMessage));
    renderComponent();
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays an authentication link if auth is required', async () => {
    const authUrl = 'https://twitch.tv/auth';
    (channelService.getStreamKey as Mock).mockRejectedValue({ authUrl });
    renderComponent();
    expect(await screen.findByText(/you need to authenticate with twitch/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /authenticate with twitch/i })).toHaveAttribute('href', authUrl);
  });

  it('calls onClose when the close button is clicked', async () => {
    renderComponent();
    await screen.findByRole('button', { name: 'Close' });
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('copies the key to the clipboard and shows a notification', async () => {
    renderComponent();
    const copyButton = await screen.findByRole('button', { name: /copy stream key/i });
    await userEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('live_12345_test');
    expect(await screen.findByText(/stream key copied to clipboard!/i)).toBeInTheDocument();
  });

  it('toggles key visibility', async () => {
    renderComponent();
    const keyInput = (await screen.findByLabelText('Stream Key')) as HTMLInputElement;
    const visibilityButton = screen.getByRole('button', { name: /toggle password visibility/i });

    expect(keyInput.type).toBe('password');

    await userEvent.click(visibilityButton);
    expect(keyInput.type).toBe('text');

    await userEvent.click(visibilityButton);
    expect(keyInput.type).toBe('password');
  });
}); 