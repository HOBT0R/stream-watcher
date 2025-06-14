import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChannelConfiguration } from './ChannelConfiguration';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { ChannelConfig } from '../../../../types/schema';

const mockChannels: ChannelConfig[] = [
  { channelName: 'test1', displayName: 'Test One', role: 'runner', group: 'A', isActive: true },
  { channelName: 'test2', displayName: 'Test Two', role: 'commentator', group: 'B', isActive: false }
];

describe('ChannelConfiguration', () => {
  const mockAdd = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  const renderComponent = (channels = mockChannels) => {
    render(
      <ThemeProvider>
        <ChannelConfiguration
          channels={channels}
          onAddChannel={mockAdd}
          onUpdateChannel={mockUpdate}
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

  it('opens an empty dialog when "Add Channel" is clicked', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: /add channel/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Channel Name')).toHaveValue('');
  });

  it('opens a pre-filled dialog when an edit button is clicked', async () => {
    renderComponent();
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Channel Name')).toHaveValue('test1');
    expect(screen.getByLabelText('Display Name')).toHaveValue('Test One');
  });

  it('calls onDeleteChannel when a delete button is clicked', async () => {
    renderComponent();
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);
    expect(mockDelete).toHaveBeenCalledWith('test1');
  });

  it('calls onAddChannel when saving a new channel', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: /add channel/i }));
    
    await userEvent.type(screen.getByLabelText('Channel Name'), 'new_channel');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockAdd).toHaveBeenCalled();
    expect(mockAdd.mock.calls[0][0].channelName).toBe('new_channel');
  });
}); 