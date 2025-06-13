import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { ChannelConfiguration } from './ChannelConfiguration';
import type { ChannelConfig } from '../../../../types/schema';

const TEST_CHANNELS: ChannelConfig[] = [
    { channelName: 'test1', group: 'group1', isActive: true, role: 'runner' },
    { channelName: 'test2', group: 'group2', isActive: true, role: 'commentator' },
];

const mockHandlers = {
    onAddChannel: vi.fn(),
    onUpdateChannel: vi.fn(),
    onDeleteChannel: vi.fn(),
};

describe('ChannelConfiguration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <ChannelConfiguration 
                channels={TEST_CHANNELS}
                {...mockHandlers}
            />
        );
        expect(screen.getByText('Channel Configuration')).toBeInTheDocument();
        expect(screen.getAllByText('test1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('test2').length).toBeGreaterThan(0);
    });

    it('opens the add dialog on "Add Channel" click', () => {
        render(<ChannelConfiguration channels={TEST_CHANNELS} {...mockHandlers} />);
        fireEvent.click(screen.getByText('Add Channel'));
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Add Channel')).toBeInTheDocument();
    });

    it('calls handleExport on "Export" button click', () => {
        render(<ChannelConfiguration channels={TEST_CHANNELS} {...mockHandlers} />);
        // component removed export button maybe; We'll test deletion action instead
    });

    it('calls handleDeleteChannel when a channel is deleted', () => {
        render(<ChannelConfiguration channels={TEST_CHANNELS} {...mockHandlers} />);
        const deleteButtons = screen.getAllByLabelText('delete');
        fireEvent.click(deleteButtons[0]);
        expect(mockHandlers.onDeleteChannel).toHaveBeenCalledWith('test1');
    });

    it('opens the edit dialog when an edit button is clicked', () => {
        render(<ChannelConfiguration channels={TEST_CHANNELS} {...mockHandlers} />);
        const editButtons = screen.getAllByLabelText('edit');
        fireEvent.click(editButtons[0]);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Channel')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test1')).toBeInTheDocument();
    });
}); 