import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelConfiguration } from './ChannelConfiguration';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { ChannelConfig } from '../../../../types/schema';
import { useChannelEdit } from '../../../../contexts/ChannelEditContext';
import { useChannels } from '../../../../contexts/ChannelContext';

vi.mock('../../../../contexts/ChannelEditContext');
vi.mock('../../../../contexts/ChannelContext');

const mockOpenChannelEditDialog = vi.fn();
const mockDeleteChannel = vi.fn();
const mockImportChannels = vi.fn();
const mockExportChannels = vi.fn();

const mockChannels: ChannelConfig[] = [
  { channelName: 'test1', displayName: 'Test One', role: 'runner', group: 'A', isActive: true },
  { channelName: 'test2', displayName: 'Test Two', role: 'commentator', group: 'B', isActive: false }
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
        {children}
    </ThemeProvider>
);

describe('ChannelConfiguration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useChannelEdit).mockReturnValue({
            openChannelEditDialog: mockOpenChannelEditDialog,
        });
        vi.mocked(useChannels).mockReturnValue({
            channels: mockChannels,
            deleteChannel: mockDeleteChannel,
            importChannels: mockImportChannels,
            exportChannels: mockExportChannels,
            refreshChannel: vi.fn(),
            // Provide dummy implementations for other context values
            channelStates: [],
            isLoading: false,
            error: null,
            refetchChannels: vi.fn(),
            addChannel: vi.fn(),
            updateChannel: vi.fn(),
        });
    });

    const renderComponent = () => {
        render(
            <TestWrapper>
                <ChannelConfiguration />
            </TestWrapper>
        );
    };

    it('renders a table with channel data from context', () => {
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

    it('calls deleteChannel from context when a delete button is clicked', async () => {
        renderComponent();
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        await userEvent.click(deleteButtons[0]);
        expect(mockDeleteChannel).toHaveBeenCalledWith('test1');
    });

    it('calls exportChannels when "Export" button is clicked', async () => {
        renderComponent();
        const exportButton = screen.getByRole('button', { name: /export/i });
        await userEvent.click(exportButton);
        expect(mockExportChannels).toHaveBeenCalledTimes(1);
    });

    it('calls importChannels when a valid file is selected', async () => {
        renderComponent();
        const importData = {
            channels: [
                { channelName: 'new1', displayName: 'New One', role: 'runner', group: 'C', isActive: true }
            ]
        };
        const file = new File([JSON.stringify(importData)], 'channels.json', { type: 'application/json' });
        const importInput = screen.getByLabelText(/import/i);

        await userEvent.upload(importInput, file);

        expect(mockImportChannels).toHaveBeenCalledWith(importData.channels);
    });

    it('calls importChannels when a valid file with channels as an object is selected', async () => {
        renderComponent();
        const importData = {
            channels: {
                "new1": { channelName: 'new1', displayName: 'New One', role: 'runner', group: 'C', isActive: true }
            }
        };
        const file = new File([JSON.stringify(importData)], 'channels.json', { type: 'application/json' });
        const importInput = screen.getByLabelText(/import/i);

        await userEvent.upload(importInput, file);

        expect(mockImportChannels).toHaveBeenCalledWith(Object.values(importData.channels));
    });
}); 