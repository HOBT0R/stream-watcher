import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider as CustomThemeProvider } from '../../../../contexts/ThemeContext';
import { vi } from 'vitest';
import { ComponentType } from 'react';
import { TopBarProps } from './TopBar';

let TopBar: ComponentType<TopBarProps>;

// Mock ThemeToggle with unstable_mockModule for ESM
vi.mock('./components/ThemeToggle', () => ({
    __esModule: true,
    default: () => <div data-testid="theme-toggle">Theme Toggle</div>
}));

// Dynamically import TopBar after mocking
beforeAll(async () => {
    TopBar = (await import('./TopBar')).default;
});

// Utility to mock matchMedia
function createMatchMedia(matches: boolean) {
    return (query: string): MediaQueryList => ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null
    } as MediaQueryList);
}

// Wrapper component to provide necessary context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <CustomThemeProvider>{children}</CustomThemeProvider>
);

describe('TopBar', () => {
    const mockSetActiveTab = vi.fn();
    const mockOnImport = vi.fn();
    const mockOnExport = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Default system preference: light
        window.matchMedia = createMatchMedia(false);
    });

    it('renders without crashing', () => {
        render(
            <TestWrapper>
                <TopBar activeTab={0} onTabChange={mockSetActiveTab} onImport={mockOnImport} onExport={mockOnExport} />
            </TestWrapper>
        );
    });

    it('displays the app name', () => {
        render(
            <TestWrapper>
                <TopBar activeTab={0} onTabChange={mockSetActiveTab} onImport={mockOnImport} onExport={mockOnExport} />
            </TestWrapper>
        );
        expect(screen.getByText('Stream Watcher')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
        render(
            <TestWrapper>
                <TopBar activeTab={0} onTabChange={mockSetActiveTab} onImport={mockOnImport} onExport={mockOnExport} />
            </TestWrapper>
        );
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('renders theme toggle', () => {
        render(
            <TestWrapper>
                <TopBar activeTab={0} onTabChange={mockSetActiveTab} onImport={mockOnImport} onExport={mockOnExport} />
            </TestWrapper>
        );
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('calls setActiveTab when navigation buttons are clicked', () => {
        render(
            <TestWrapper>
                <TopBar activeTab={0} onTabChange={mockSetActiveTab} onImport={mockOnImport} onExport={mockOnExport} />
            </TestWrapper>
        );

        fireEvent.click(screen.getByText('Dashboard'));
        expect(mockSetActiveTab).toHaveBeenCalledWith(expect.anything(), 0);

        fireEvent.click(screen.getByText('Configuration'));
        expect(mockSetActiveTab).toHaveBeenCalledWith(expect.anything(), 1);
    });

    it('highlights the active tab', () => {
        render(
            <TestWrapper>
                <TopBar activeTab={0} onTabChange={mockSetActiveTab} onImport={mockOnImport} onExport={mockOnExport} />
            </TestWrapper>
        );

        const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
        expect(dashboardButton).toHaveStyle('backgroundColor: primary.main');
    });
}); 