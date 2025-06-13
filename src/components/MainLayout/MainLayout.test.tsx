import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../../theme';
import type { ChannelConfig } from '../../types/schema';

let MainLayout: any;
let mockUseChannelManager: ReturnType<typeof vi.fn>;

// Mock context to provide useChannelManager
vi.mock('../../contexts/ChannelContext', () => {
    mockUseChannelManager = vi.fn();
    return {
        useChannelManager: (...args: any[]) => mockUseChannelManager(...args),
        // Provide dummy implementations for other hooks if needed by children
        useChannels: () => ({
            channelStates: [],
            isLoading: false,
            error: null,
            refetchChannels: vi.fn(),
        }),
    };
});

// Mock child components
vi.mock('./components/TopBar', () => ({
    __esModule: true,
    default: ({ activeTab, onTabChange }: { activeTab: number; onTabChange: (e: React.SyntheticEvent, tab: number) => void }) => (
        <div data-testid="top-bar">
            <button onClick={(e) => onTabChange(e, 0)}>Dashboard</button>
            <button onClick={(e) => onTabChange(e, 1)}>Configuration</button>
            <span>Active Tab: {activeTab}</span>
        </div>
    ),
    TopBar: ({ activeTab, onTabChange }: { activeTab: number; onTabChange: (e: React.SyntheticEvent, tab: number) => void }) => (
        <div data-testid="top-bar">
            <button onClick={(e) => onTabChange(e, 0)}>Dashboard</button>
            <button onClick={(e) => onTabChange(e, 1)}>Configuration</button>
            <span>Active Tab: {activeTab}</span>
        </div>
    ),
}));

vi.mock('./components/ChannelDashboard', () => ({
    __esModule: true,
    ChannelDashboard: () => <div data-testid="channel-dashboard">Dashboard Content</div>,
}));

vi.mock('./components/ChannelConfiguration', () => ({
    __esModule: true,
    ChannelConfiguration: () => <div data-testid="channel-configuration">Configuration Content</div>,
}));

// Dynamically import MainLayout after mocks
beforeAll(async () => {
    MainLayout = (await import('./MainLayout')).default;
});

// Test data
const TEST_CHANNELS: ChannelConfig[] = [
    { channelName: 'test1', group: 'group1', role: 'runner', isActive: true },
    { channelName: 'test2', group: 'group2', role: 'commentator', isActive: true },
];

const mockHandlers = {
    handleAddChannel: vi.fn(),
    handleUpdateChannel: vi.fn(),
    handleDeleteChannel: vi.fn(),
    handleImport: vi.fn(),
    handleExport: vi.fn(),
};

// Wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={getAppTheme(false)}>{children}</ThemeProvider>
);

describe('MainLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseChannelManager.mockReturnValue({
            channels: TEST_CHANNELS,
            ...mockHandlers,
        });
    });

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

    it('uses useChannelManager when rendering Configuration', () => {
        render(
            <TestWrapper>
                <MainLayout activeTab={1} setActiveTab={vi.fn()} />
            </TestWrapper>
        );

        expect(mockUseChannelManager).toHaveBeenCalled();
        expect(screen.getByTestId('channel-configuration')).toBeInTheDocument();
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