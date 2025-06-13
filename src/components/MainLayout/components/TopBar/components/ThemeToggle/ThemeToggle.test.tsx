import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '.';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../../../../../../theme';
import { ThemeContext } from '../../../../../../contexts/ThemeContext';

// Wrapper component to provide necessary context
const TestWrapper = ({ children, isDarkMode = false, toggleTheme = vi.fn() }: { 
    children: React.ReactNode;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}) => {
    const theme = getAppTheme(isDarkMode);
    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

describe('ThemeToggle', () => {
    const mockToggleTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <TestWrapper>
                <ThemeToggle />
            </TestWrapper>
        );
    });

    it('displays sun icon in light mode', () => {
        render(
            <TestWrapper isDarkMode={false}>
                <ThemeToggle />
            </TestWrapper>
        );
        expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();
    });

    it('displays moon icon in dark mode', () => {
        render(
            <TestWrapper isDarkMode={true}>
                <ThemeToggle />
            </TestWrapper>
        );
        expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();
    });

    it('calls toggleTheme when clicked', () => {
        render(
            <TestWrapper toggleTheme={mockToggleTheme}>
                <ThemeToggle />
            </TestWrapper>
        );

        fireEvent.click(screen.getByRole('checkbox', { name: /theme switch/i }));
        expect(mockToggleTheme).toHaveBeenCalled();
    });
}); 