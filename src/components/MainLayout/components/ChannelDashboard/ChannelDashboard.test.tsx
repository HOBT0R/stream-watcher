import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelDashboard } from './ChannelDashboard';
import { useChannels } from '../../../../contexts/ChannelContext';
import { useChannelFilter } from '../../../../contexts/ChannelFilterContext';
import { ChannelState } from '../../../../types/schema';

// Mock contexts
vi.mock('../../../../contexts/ChannelContext');
vi.mock('../../../../contexts/ChannelFilterContext');

// Mock child component
vi.mock('./components/ChannelGroup', () => ({
    ChannelGroup: ({ groupName }: { groupName: string }) => <div data-testid="channel-group">{groupName}</div>,
}));

const mockChannels: ChannelState[] = [
    { channelName: 'a', displayName: 'A', group: 'G1', status: 'online', role: 'runner', isActive: true, lastUpdated: '' },
    { channelName: 'b', displayName: 'B', group: 'G1', status: 'offline', role: 'commentator', isActive: true, lastUpdated: '' },
    { channelName: 'c', displayName: 'C', group: 'G2', status: 'online', role: 'runner', isActive: true, lastUpdated: '' },
];

const mockSetGlobalView = vi.fn();
const mockSetSearchText = vi.fn();
const mockSetRoleFilter = vi.fn();

describe('ChannelDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useChannels).mockReturnValue({
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
        });
        vi.mocked(useChannelFilter).mockReturnValue({
            globalView: 'all',
            searchText: '',
            roleFilter: 'all',
            setGlobalView: mockSetGlobalView,
            setSearchText: mockSetSearchText,
            setRoleFilter: mockSetRoleFilter,
        });
    });

    it('renders filter controls', () => {
        render(<ChannelDashboard />);
        expect(screen.getByLabelText('global channel view')).toBeInTheDocument();
        expect(screen.getByLabelText('Role')).toBeInTheDocument();
        expect(screen.getByLabelText('Search Channels')).toBeInTheDocument();
    });

    it('calls filter context setters on user interaction', () => {
        render(<ChannelDashboard />);
        
        // We will only test the search input for now, as the Select
        // component requires a more complex interaction that is not the focus of this unit test.
        fireEvent.change(screen.getByLabelText('Search Channels'), { target: { value: 'test search' } });
        expect(mockSetSearchText).toHaveBeenCalledWith('test search');
    });

    it('renders only groups that have visible channels based on filters', () => {
        // Override default mock for this test
        vi.mocked(useChannelFilter).mockReturnValue({
            globalView: 'all',
            searchText: 'A', // Should only match channel 'a' in group 'G1'
            roleFilter: 'all',
            setGlobalView: mockSetGlobalView,
            setSearchText: mockSetSearchText,
            setRoleFilter: mockSetRoleFilter,
        });

        render(<ChannelDashboard />);
        
        const groups = screen.getAllByTestId('channel-group');
        expect(groups).toHaveLength(1);
        expect(groups[0]).toHaveTextContent('G1');
        expect(screen.queryByText('G2')).not.toBeInTheDocument();
    });

    it('renders all groups when filters are at default', () => {
        render(<ChannelDashboard />);
        const groups = screen.getAllByTestId('channel-group');
        expect(groups).toHaveLength(2);
        expect(groups[0]).toHaveTextContent('G1');
        expect(groups[1]).toHaveTextContent('G2');
    });
}); 