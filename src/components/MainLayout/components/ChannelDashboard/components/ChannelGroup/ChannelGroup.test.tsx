import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ChannelGroup } from './ChannelGroup';
import { ThemeProvider } from '../../../../../../contexts/ThemeContext';
import { useChannels } from '../../../../../../contexts/ChannelContext';
import { useChannelFilter } from '../../../../../../contexts/ChannelFilterContext';
import { ChannelState } from '../../../../../../types/schema';
import { ChannelView, ChannelRole } from '../../../../../../constants/channel';

vi.mock('../../../../../../contexts/ChannelContext');
vi.mock('../../../../../../contexts/ChannelFilterContext');
vi.mock('./components/ChannelList', () => ({
    ChannelList: ({ channels }: { channels: ChannelState[] }) => (
        <div data-testid="channel-list">
            {channels.map(c => <div key={c.channelName}>{c.displayName}</div>)}
        </div>
    ),
}));

const mockChannels: ChannelState[] = [
  { channelName: 'runner1', displayName: 'Runner 1', status: 'online', role: 'runner', group: 'A', isActive: true, lastUpdated: '' },
  { channelName: 'commentator1', displayName: 'Commentator 1', status: 'offline', role: 'commentator', group: 'A', isActive: true, lastUpdated: '' },
  { channelName: 'runner2', displayName: 'Runner 2', status: 'online', role: 'runner', group: 'B', isActive: true, lastUpdated: '' }
];

const mockUseChannels = {
    channelStates: mockChannels,
    channels: [],
    isLoading: false,
    error: null,
    refetchChannels: vi.fn(),
    addChannel: vi.fn(),
    updateChannel: vi.fn(),
    deleteChannel: vi.fn(),
    importChannels: vi.fn(),
    exportChannels: vi.fn(),
    refreshChannel: vi.fn(),
};

const mockUseChannelFilter: {
    globalView: ChannelView;
    searchText: string;
    roleFilter: ChannelRole;
    setGlobalView: (view: ChannelView) => void;
    setSearchText: (text: string) => void;
    setRoleFilter: (role: ChannelRole) => void;
} = {
    globalView: 'all',
    searchText: '',
    roleFilter: 'all',
    setGlobalView: vi.fn(),
    setSearchText: vi.fn(),
    setRoleFilter: vi.fn(),
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
        {children}
    </ThemeProvider>
);

describe('ChannelGroup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useChannels).mockReturnValue(mockUseChannels);
        vi.mocked(useChannelFilter).mockReturnValue(mockUseChannelFilter);
    });

    const renderComponent = (props = {}) => {
        const defaultProps = {
            groupName: "A",
            defaultExpanded: true,
        };
        return render(
            <TestWrapper>
                <ChannelGroup {...defaultProps} {...props} />
            </TestWrapper>
        );
    };

    it('renders the group name and stats for its channels', async () => {
        renderComponent();
        expect(screen.getByText('A')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('1/2 online')).toBeInTheDocument();
        });
    });

    it('renders a list of its channels when expanded', () => {
        renderComponent();
        expect(screen.getByText('Runner 1')).toBeInTheDocument();
        expect(screen.getByText('Commentator 1')).toBeInTheDocument();
        expect(screen.queryByText('Runner 2')).not.toBeInTheDocument(); // Belongs to group B
    });

    it('hides the channel list when collapsed', async () => {
        renderComponent({ defaultExpanded: false });
        const list = screen.getByTestId('channel-list');
        expect(list).not.toBeVisible();
        await userEvent.click(screen.getByRole('button', { name: /expand/i }));
        expect(list).toBeVisible();
    });

    it('filters channels based on the search text from filter context', () => {
        vi.mocked(useChannelFilter).mockReturnValue({
            ...mockUseChannelFilter,
            searchText: 'Runner 1',
        });
        renderComponent();
        expect(screen.getByText('Runner 1')).toBeInTheDocument();
        expect(screen.queryByText('Commentator 1')).not.toBeInTheDocument();
    });

    it('filters channels based on the role from filter context', () => {
        vi.mocked(useChannelFilter).mockReturnValue({
            ...mockUseChannelFilter,
            roleFilter: 'commentator',
        });
        renderComponent();
        expect(screen.queryByText('Runner 1')).not.toBeInTheDocument();
        expect(screen.getByText('Commentator 1')).toBeInTheDocument();
    });
    
    it('renders nothing if no channels match the filters', () => {
        vi.mocked(useChannelFilter).mockReturnValue({
            ...mockUseChannelFilter,
            searchText: 'NonExistent',
        });
        const { container } = renderComponent();
        expect(container).toBeEmptyDOMElement();
    });
}); 