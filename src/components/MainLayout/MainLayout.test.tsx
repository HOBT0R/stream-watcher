import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../../theme';
import { ChannelProvider } from '../../contexts/ChannelContext';
import { ChannelFilterProvider } from '../../contexts/ChannelFilterContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { MainLayout } from './MainLayout';

// Mock child components
vi.mock('./components/TopBar', () => ({
    TopBar: ({ activeTab, onTabChange }: { activeTab: number; onTabChange: (e: unknown, tab: number) => void }) => (
        <div data-testid="top-bar">
            <button onClick={(e) => onTabChange(e, 0)}>Dashboard</button>
            <button onClick={(e) => onTabChange(e, 1)}>Configuration</button>
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

// Wrapper component for providing all necessary contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MuiThemeProvider theme={getAppTheme(false)}>
        <ThemeProvider>
            <ChannelProvider>
                <ChannelFilterProvider>
                    {children}
                </ChannelFilterProvider>
            </ChannelProvider>
        </ThemeProvider>
    </MuiThemeProvider>
);

describe('MainLayout', () => {
    it('renders without crashing', () => {
        render(
            <TestWrapper>
                <MainLayout activeTab={0} setActiveTab={vi.fn()} />
            </TestWrapper>
        );
    });

    it('renders TopBar with correct props', () => {
        const setActiveTab = vi.fn();
        render(
            <TestWrapper>
                <MainLayout activeTab={0} setActiveTab={setActiveTab} />
            </TestWrapper>
        );

        const topBar = screen.getByTestId('top-bar');
        expect(topBar).toBeInTheDocument();
        expect(topBar).toHaveTextContent('Active Tab: 0');
    });

    it('renders Dashboard when activeTab is 0', () => {
        render(
            <TestWrapper>
                <MainLayout activeTab={0} setActiveTab={vi.fn()} />
            </TestWrapper>
        );

        expect(screen.getByTestId('channel-dashboard')).toBeInTheDocument();
        expect(screen.queryByTestId('channel-configuration')).not.toBeInTheDocument();
    });

    it('renders Configuration when activeTab is 1', () => {
        render(
            <TestWrapper>
                <MainLayout activeTab={1} setActiveTab={vi.fn()} />
            </TestWrapper>
        );

        expect(screen.getByTestId('channel-configuration')).toBeInTheDocument();
        expect(screen.queryByTestId('channel-dashboard')).not.toBeInTheDocument();
    });

    it('handles tab switching correctly', () => {
        const setActiveTab = vi.fn();
        render(
            <TestWrapper>
                <MainLayout activeTab={0} setActiveTab={setActiveTab} />
            </TestWrapper>
        );

        fireEvent.click(screen.getByText('Configuration'));
        expect(setActiveTab).toHaveBeenCalledWith(1);

        fireEvent.click(screen.getByText('Dashboard'));
        expect(setActiveTab).toHaveBeenCalledWith(0);
    });
}); 