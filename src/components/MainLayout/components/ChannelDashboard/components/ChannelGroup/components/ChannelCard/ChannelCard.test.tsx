import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelCard, ChannelCardProps } from './ChannelCard';
import { ThemeProvider } from '../../../../../../../../contexts/ThemeContext';
import { useChannelEdit } from '../../../../../../../../contexts/ChannelEditContext';
import { ChannelConfig } from '../../../../../../../../types/schema';

vi.mock('../../../../../../../../contexts/ChannelEditContext', () => ({
    useChannelEdit: vi.fn(),
}));

const mockOpenChannelEditDialog = vi.fn();

const mockChannel: ChannelCardProps = {
  channelName: 'test-channel',
  displayName: 'Test Channel Name',
  status: 'online',
  role: 'runner',
  lastUpdated: new Date().toISOString(),
  group: 'A',
  isActive: true,
  onCopy: vi.fn(),
  onOpenStreamKey: vi.fn(),
  onEdit: vi.fn(),
};

const renderComponent = (props: Partial<ChannelCardProps> = {}) => {
  return render(
    <ThemeProvider>
      <ChannelCard {...mockChannel} {...props} />
    </ThemeProvider>
  );
};

describe('ChannelCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useChannelEdit).mockReturnValue({
            openChannelEditDialog: mockOpenChannelEditDialog,
        });
    });

  it('highlights searchText in channel displayName', () => {
    renderComponent({ searchText: 'Channel' });
    const displayNameElement = screen.getByText((_content, element) => {
        return element?.tagName.toLowerCase() === 'h6' && element.textContent === 'Test Channel Name'
    });
    const highlightedPart = within(displayNameElement).getByText('Channel');
    
    expect(highlightedPart).toBeInTheDocument();
    expect(highlightedPart.tagName).toBe('SPAN');
    expect(highlightedPart.classList.contains('MuiTypography-root')).toBe(true);
  });

    it('is case-insensitive when highlighting', () => {
        renderComponent({ searchText: 'channel' }); // lowercase
        const displayNameElement = screen.getByText((_content, element) => {
            return element?.tagName.toLowerCase() === 'h6' && element.textContent === 'Test Channel Name'
        });
        const highlightedPart = within(displayNameElement).getByText('Channel'); // Original is capitalized
        
        expect(highlightedPart).toBeInTheDocument();
        expect(highlightedPart.tagName).toBe('SPAN');
    });

    it('does not highlight when searchText does not match', () => {
        renderComponent({ searchText: 'nomatch' });
        const displayNameElement = screen.getByText('Test Channel Name');
        // Check that no span is rendered within the h6
        const highlightedPart = displayNameElement.querySelector('span');
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
}); 