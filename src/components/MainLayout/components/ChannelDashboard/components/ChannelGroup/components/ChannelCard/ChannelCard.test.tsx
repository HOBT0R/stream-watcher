import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelCard, ChannelCardProps } from '@/components/MainLayout/components/ChannelDashboard/components/ChannelGroup/components/ChannelCard/ChannelCard';
import { useChannelEdit } from '@/contexts/ChannelEditContext';
import { useChannels } from '@/contexts/ChannelContext';
import { useVideo } from '@/contexts/VideoContext';
import { ChannelConfig, ChannelState } from '@/types/schema';

vi.mock('@/contexts/ChannelEditContext');
vi.mock('@/contexts/ChannelContext');
vi.mock('@/contexts/VideoContext');
vi.mock('@/hooks/useIntersectionObserver', () => ({
    useIntersectionObserver: () => true,
}));
vi.mock('@/components/VideoPlayer', () => ({
    default: vi.fn(() => <div data-testid="video-player-mock" />),
}));

const mockOpenChannelEditDialog = vi.fn();
const mockRefreshChannel = vi.fn();
const mockAddPlayingVideo = vi.fn();
const mockRemovePlayingVideo = vi.fn();

const mockChannel: ChannelState = {
  channelName: 'test-channel',
  displayName: 'Test Channel Name',
  status: 'online',
  role: 'runner',
  lastUpdated: new Date().toISOString(),
  group: 'A',
  isActive: true,
};

const renderComponent = (props: Partial<ChannelCardProps> = {}, playingVideos: string[] = []) => {
    vi.mocked(useVideo).mockReturnValue({
        playingVideos,
        addPlayingVideo: mockAddPlayingVideo,
        removePlayingVideo: mockRemovePlayingVideo,
    });

    return render(
        <ChannelCard {...mockChannel} {...props} />
    );
};

describe('ChannelCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useChannelEdit).mockReturnValue({
            openChannelEditDialog: mockOpenChannelEditDialog,
        });

        // This mock is necessary because ChannelCard uses a function from this context via props.
        vi.mocked(useChannels).mockReturnValue({
            updateChannel: vi.fn(),
            refreshChannel: mockRefreshChannel,
            // Provide any other functions or state needed by ChannelCard from this context
            channelStates: [],
            channels: [],
            isLoading: false,
            error: null,
            refetchChannels: vi.fn(),
            addChannel: vi.fn(),
            deleteChannel: vi.fn(),
            importChannels: vi.fn(),
            exportChannels: vi.fn(),
            pollingInterval: 90,
            setPollingInterval: vi.fn(),
        });

        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

  it('highlights searchText in channel displayName', () => {
    renderComponent({ searchText: 'Channel' });
    const displayNameContainer = screen.getByTestId('channel-card-display-name');
    const highlightedPart = within(displayNameContainer).getByText('Channel');
    
    expect(highlightedPart).toBeInTheDocument();
    expect(highlightedPart.tagName).toBe('SPAN');
  });

    it('is case-insensitive when highlighting', () => {
        renderComponent({ searchText: 'channel' }); // lowercase
        const displayNameContainer = screen.getByTestId('channel-card-display-name');
        const highlightedPart = within(displayNameContainer).getByText('Channel'); // Original is capitalized
        
        expect(highlightedPart).toBeInTheDocument();
        expect(highlightedPart.tagName).toBe('SPAN');
    });

    it('does not highlight when searchText does not match', () => {
        renderComponent({ searchText: 'nomatch' });
        const displayNameContainer = screen.getByTestId('channel-card-display-name');
        // Check that no span is rendered within the h6
        const highlightedPart = displayNameContainer.querySelector('span');
        expect(highlightedPart).toBeNull();
    });

    it('calls openChannelEditDialog with channel data when edit button is clicked', async () => {
        renderComponent();
        const editButton = screen.getByRole('button', { name: /edit channel/i });
        await userEvent.click(editButton);

        const expectedChannelConfig: ChannelConfig = {
            channelName: mockChannel.channelName,
            displayName: mockChannel.displayName,
            group: mockChannel.group,
            description: mockChannel.description,
            role: mockChannel.role,
            isActive: mockChannel.isActive,
        };
        
        expect(mockOpenChannelEditDialog).toHaveBeenCalledWith(expectedChannelConfig);
    });

    it('copies channel name to clipboard when copy button is clicked', async () => {
        renderComponent();
        const copyButton = screen.getByRole('button', { name: /copy channel name/i });
        await userEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockChannel.channelName);
    });

    it('calls refreshChannel with the channel name when refresh button is clicked', async () => {
        renderComponent();
        const refreshButton = screen.getByRole('button', { name: /refresh channel status/i });
        await userEvent.click(refreshButton);

        expect(mockRefreshChannel).toHaveBeenCalledWith(mockChannel.channelName);
    });

    describe('Video Player Functionality', () => {
        it('should show play button and not the video player initially', () => {
            renderComponent();
            expect(screen.getByTestId('play-button')).toBeInTheDocument();
            expect(screen.queryByTestId('video-player-mock')).not.toBeInTheDocument();
        });

        it('should disable play button if channel is offline', () => {
            renderComponent({ status: 'offline' });
            expect(screen.getByTestId('play-button')).toBeDisabled();
        });

        it('calls addPlayingVideo when play is clicked', async () => {
            renderComponent();
            await userEvent.click(screen.getByTestId('play-button'));
            expect(mockAddPlayingVideo).toHaveBeenCalledWith(mockChannel.channelName);
        });

        it('renders the video player and stop button when playing', () => {
            renderComponent({}, [mockChannel.channelName]);
            expect(screen.getByTestId('video-player-mock')).toBeInTheDocument();
            expect(screen.getByTestId('stop-button')).toBeInTheDocument();
        });

        it('calls removePlayingVideo when stop is clicked', async () => {
            renderComponent({}, [mockChannel.channelName]);
            await userEvent.click(screen.getByTestId('stop-button'));
            expect(mockRemovePlayingVideo).toHaveBeenCalledWith(mockChannel.channelName);
        });
    });
}); 