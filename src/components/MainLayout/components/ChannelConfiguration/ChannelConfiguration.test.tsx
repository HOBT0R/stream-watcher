import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelConfiguration } from './ChannelConfiguration';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { ChannelConfig } from '../../../../types/schema';
import { useChannelEdit } from '../../../../contexts/ChannelEditContext';

vi.mock('../../../../contexts/ChannelEditContext', () => ({
    useChannelEdit: vi.fn(),
}));

const mockOpenChannelEditDialog = vi.fn();

const mockChannels: ChannelConfig[] = [
  { channelName: 'test1', displayName: 'Test One', role: 'runner', group: 'A', isActive: true },
  { channelName: 'test2', displayName: 'Test Two', role: 'commentator', group: 'B', isActive: false }
];

describe('ChannelConfiguration', () => {
    const mockDelete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useChannelEdit).mockReturnValue({
            openChannelEditDialog: mockOpenChannelEditDialog,
        });
    });

    const renderComponent = (channels = mockChannels) => {
        render(
            <ThemeProvider>
                <ChannelConfiguration
                    channels={channels}
                    onDeleteChannel={mockDelete}
                />
            </ThemeProvider>
        );
    };

    it('renders a table with channel data', () => {
        renderComponent();
        expect(screen.getByText('Test One')).toBeInTheDocument();
        expect(screen.getByText('Test Two')).toBeInTheDocument();
        expect(screen.getByText('runner')).toBeInTheDocument();
        expect(screen.getByText('commentator')).toBeInTheDocument();
    });

    it('calls openChannelEditDialog with null when "Add Channel" is clicked', async () => {
        renderComponent();
        await userEvent.click(screen.getByRole('button', { name: /add channel/i }));
        expect(mockOpenChannelEditDialog).toHaveBeenCalledWith(null);
    });

    it('calls openChannelEditDialog with channel data when an edit button is clicked', async () => {
        renderComponent();
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        await userEvent.click(editButtons[0]);
        expect(mockOpenChannelEditDialog).toHaveBeenCalledWith(mockChannels[0]);
    });

    it('calls onDeleteChannel when a delete button is clicked', async () => {
        renderComponent();
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        await userEvent.click(deleteButtons[0]);
        expect(mockDelete).toHaveBeenCalledWith('test1');
    });
}); 