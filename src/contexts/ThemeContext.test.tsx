import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { ComponentType } from 'react';
import { ThemeContextType } from './ThemeContext';

// Top-level mock for useLocalStorage
const mockUseLocalStorage = vi.fn();
vi.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: mockUseLocalStorage,
}));

// Create a mock matchMedia function
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

describe('ThemeContext', () => {
  let ThemeProvider: ComponentType<{ children: React.ReactNode }>;
  let useTheme: () => ThemeContextType;

  beforeAll(async () => {
    // Import after mocking
    const ThemeContextModule = await import('./ThemeContext');
    ThemeProvider = ThemeContextModule.ThemeProvider;
    useTheme = ThemeContextModule.useTheme;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = createMatchMedia(false);
  });

  const TestComponent = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    return (
      <div>
        <div data-testid="theme-mode">{isDarkMode ? 'dark' : 'light'}</div>
        <button onClick={toggleTheme}>Toggle Theme</button>
      </div>
    );
  };

  it('uses system preference (dark) when no user preference is set', () => {
    window.matchMedia = createMatchMedia(true);
    mockUseLocalStorage.mockReturnValue([null, vi.fn()]);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('uses user preference (light) when system prefers dark', () => {
    window.matchMedia = createMatchMedia(true); // system prefers dark
    mockUseLocalStorage.mockReturnValue([false, vi.fn()]); // user prefers light

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('uses user preference (dark) when system prefers light', () => {
    window.matchMedia = createMatchMedia(false); // system prefers light
    mockUseLocalStorage.mockReturnValue([true, vi.fn()]); // user prefers dark

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('calls toggle function when button is clicked', () => {
    const mockSetTheme = vi.fn();
    mockUseLocalStorage.mockReturnValue([false, mockSetTheme]);
    window.matchMedia = createMatchMedia(true); // system prefers dark


    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Toggle Theme'));
    
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
    // Verify it was called with a function (the toggle logic)
    expect(mockSetTheme).toHaveBeenCalledWith(expect.any(Function));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light'); // should be light after toggle
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    console.error = originalError;
  });
}); 