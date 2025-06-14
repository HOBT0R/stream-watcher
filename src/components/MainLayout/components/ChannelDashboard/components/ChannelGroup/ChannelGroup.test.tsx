import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChannelGroup } from './ChannelGroup';
import { ThemeProvider } from '../../../../../../contexts/ThemeContext';
import * as ChannelContext from '../../../../../../contexts/ChannelContext';
import { ChannelState } from '../../../../../../types/schema';

const mockChannels: ChannelState[] = [
  { channelName: 'runner1', displayName: 'Runner 1', status: 'online', role: 'runner', group: 'A', isActive: true, lastUpdated: new Date().toISOString() },
  { channelName: 'commentator1', displayName: 'Commentator 1', status: 'offline', role: 'commentator', group: 'A', isActive: true, lastUpdated: new Date().toISOString() }
];

describe('ChannelGroup', () => {
    beforeEach(() => {
        vi.spyOn(ChannelContext, 'useChannels').mockReturnValue({
            channelStates: mockChannels,
            isLoading: false,
            error: null,
            refetchChannels: () => {},
            channels: [],
            handleAddChannel: () => {},
            handleUpdateChannel: () => {},
            handleDeleteChannel: () => {},
            handleImport: () => {},
            handleExport: () => {},
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

  const renderComponent = (props = {}) => {
    const defaultProps = {
        groupName: "Group A",
        channels: mockChannels,
        defaultExpanded: true,
        searchText: ""
    }
    return render(
      <ThemeProvider>
        <ChannelContext.ChannelProvider pollingIntervalSeconds={30}>
          <ChannelGroup {...defaultProps} {...props} />
        </ChannelContext.ChannelProvider>
      </ThemeProvider>
    );
  };

  it('renders the group name and channel count', async () => {
    renderComponent();
    expect(screen.getByText('Group A')).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.getByText('1/2 online')).toBeInTheDocument();
    })
  });

  it('renders a list of channels when expanded', () => {
    renderComponent();
    expect(screen.getByText('Runner 1')).toBeInTheDocument();
  });

  it('does not render the channel list when collapsed', async () => {
    renderComponent({ defaultExpanded: false });
    
    // The list is rendered but hidden by Collapse, so we check for visibility
    const runner1Card = screen.queryByText('Runner 1');
    expect(runner1Card).not.toBeVisible();
    
    const expandButton = screen.getByRole('button', { name: /expand/i });
    await userEvent.click(expandButton);
    
    await waitFor(() => {
        expect(screen.getByText('Runner 1')).toBeVisible();
    });
  });

}); 