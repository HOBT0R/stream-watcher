import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../../theme';
import { ChannelProvider } from '../../contexts/ChannelContext';
import { ChannelFilterProvider } from '../../contexts/ChannelFilterContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { MainLayout } from './MainLayout';
import { ApiProvider } from '../../contexts/ApiContext';
import { useAuth, AuthContextType } from '../../contexts/AuthContext';
import React from 'react';

// Mock child components
vi.mock('./components/TopBar', () => ({
    TopBar: ({ activeTab, onTabChange }: { activeTab: number; onTabChange: (e: unknown, tab: number) => void }) => (
        <div data-testid="top-bar">
            <button data-testid="dashboard-tab" onClick={(e) => onTabChange(e, 0)}>Dashboard</button>
            <button data-testid="config-tab" onClick={(e) => onTabChange(e, 1)}>Configuration</button>
            <span>Active Tab: {activeTab}</span>
        </div>
    ),
}));
vi.mock('./components/ChannelDashboard', () => ({
    ChannelDashboard: () => <div data-testid="channel-dashboard">Dashboard Content</div>,
}));
vi.mock('./components/ChannelConfiguration', () => ({
    ChannelConfiguration: () => <div data-testid="channel-configuration">Configuration Content</div>,
}));
vi.mock('../../contexts/AuthContext');

// Wrapper component for providing all necessary contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MuiThemeProvider theme={getAppTheme(false)}>
        <ThemeProvider>
            <ApiProvider>
                <ChannelProvider>
                    <ChannelFilterProvider>
                        {children}
                    </ChannelFilterProvider>
                </ChannelProvider>
            </ApiProvider>
        </ThemeProvider>
    </MuiThemeProvider>
);

describe('MainLayout', () => {
    const mockSetActiveTab = vi.fn();
    const mockOnLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth as () => AuthContextType).mockReturnValue({
            user: null, token: 'mock-token', loading: false, login: vi.fn(), logout: vi.fn(),
        });
    });

    it('renders without crashing', () => {
        render(<MainLayout activeTab={0} setActiveTab={mockSetActiveTab} onLogout={mockOnLogout} />, { wrapper: TestWrapper });
        expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });

    it('renders Dashboard when activeTab is 0', () => {
        render(<MainLayout activeTab={0} setActiveTab={mockSetActiveTab} onLogout={mockOnLogout} />, { wrapper: TestWrapper });
        expect(screen.getByTestId('channel-dashboard')).toBeInTheDocument();
        expect(screen.queryByTestId('channel-configuration')).not.toBeInTheDocument();
    });

    it('renders Configuration when activeTab is 1', () => {
        render(<MainLayout activeTab={1} setActiveTab={mockSetActiveTab} onLogout={mockOnLogout} />, { wrapper: TestWrapper });
        expect(screen.getByTestId('channel-configuration')).toBeInTheDocument();
        expect(screen.queryByTestId('channel-dashboard')).not.toBeInTheDocument();
    });

    it('handles tab switching correctly', () => {
        render(<MainLayout activeTab={0} setActiveTab={mockSetActiveTab} onLogout={mockOnLogout} />, { wrapper: TestWrapper });
        fireEvent.click(screen.getByTestId('config-tab'));
        expect(mockSetActiveTab).toHaveBeenCalledWith(1);
    });
}); 