import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChannelEditDialog } from './ChannelEditDialog';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { ChannelConfig } from '../../../../types/schema';

const mockChannel: ChannelConfig = {
  channelName: 'test',
  displayName: 'Test Channel',
  group: 'A',
  description: 'A test channel',
  role: 'runner',
  isActive: true,
};

describe('ChannelEditDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly when adding a new channel', () => {
        render(
            <ThemeProvider>
                <ChannelEditDialog open={true} onClose={mockOnClose} onSave={mockOnSave} channelToEdit={null} />
            </ThemeProvider>
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Add Channel')).toBeInTheDocument();
        expect(screen.getByLabelText('Channel Name')).toHaveValue('');
        expect(screen.getByLabelText('Channel Name')).not.toBeDisabled();
    });

    it('renders correctly when editing an existing channel', () => {
        render(
            <ThemeProvider>
                <ChannelEditDialog open={true} onClose={mockOnClose} onSave={mockOnSave} channelToEdit={mockChannel} />
            </ThemeProvider>
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Channel')).toBeInTheDocument();
        expect(screen.getByLabelText('Channel Name')).toHaveValue(mockChannel.channelName);
        expect(screen.getByLabelText('Channel Name')).toBeDisabled();
        expect(screen.getByLabelText('Display Name')).toHaveValue(mockChannel.displayName);
    });

    it('calls onClose when the cancel button is clicked', async () => {
        render(
            <ThemeProvider>
                <ChannelEditDialog open={true} onClose={mockOnClose} onSave={mockOnSave} channelToEdit={null} />
            </ThemeProvider>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('updates form fields and calls onSave with the new data', async () => {
        render(
            <ThemeProvider>
                <ChannelEditDialog open={true} onClose={mockOnClose} onSave={mockOnSave} channelToEdit={null} />
            </ThemeProvider>
        );

        await userEvent.type(screen.getByLabelText('Channel Name'), 'new_channel');
        await userEvent.type(screen.getByLabelText('Display Name'), 'New Display Name');

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
            channelName: 'new_channel',
            displayName: 'New Display Name'
        }));
    });
}); 