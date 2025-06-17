import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMediaQuery } from '@mui/material';

/**
 * @interface ThemeContextType
 * Defines the shape of the theme context.
 */
export interface ThemeContextType {
    /** A boolean indicating if dark mode is currently active. */
    isDarkMode: boolean;
    /** A function to toggle the theme between light and dark mode. */
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provides the theme context to its children.
 * It manages the theme state, including user preference (stored in local storage)
 * and system preference (via `prefers-color-scheme` media query).
 *
 * @param {object} props The component props.
 * @param {ReactNode} props.children The child components to render.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [userPrefersDark, setUserPrefersDark] = useLocalStorage<boolean | null>('themeMode', null);
    const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
    const isDarkMode = userPrefersDark ?? systemPrefersDark;
    

    const toggleTheme = () => {
        setUserPrefersDark((prev: boolean | null) => (prev === null ? !systemPrefersDark : !prev));
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * A hook for accessing the theme context.
 * This provides access to the current theme state (`isDarkMode`) and the `toggleTheme` function.
 *
 * @returns The theme context.
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}; 