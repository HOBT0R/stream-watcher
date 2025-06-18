import { createTheme, Theme, Palette } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
      highlight: Palette['primary'];
    }
    interface PaletteOptions {
      highlight?: PaletteOptions['primary'];
    }
}

/**
 * Theme mode preference
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme configuration for the application
 */
export interface AppTheme extends Theme {
    palette: Palette & {
        mode: ThemeMode;
        primary: {
            main: string;
        };
        secondary: {
            main: string;
        };
        success: {
            main: string;
        };
        highlight: {
            main: string;
            contrastText: string;
        };
    };
}

export const getAppTheme = (prefersDarkMode: boolean): AppTheme => createTheme({
    palette: {
        mode: prefersDarkMode ? 'dark' : 'light',
        ...(prefersDarkMode
            ? { // Dark mode palette
                primary: {
                    main: '#A100FF', // Electric Purple
                },
                secondary: {
                    main: '#FFD700', // Neon Yellow
                },
                success: {
                    main: '#00FF66', // Neon Green (used for accent in the description)
                },
                highlight: {
                    main: '#FFD700', // Neon Yellow
                    contrastText: '#000000', // Black
                },
                // You may want to define other colors like background, text, etc. for dark mode
            }
            : { // Light mode palette
                primary: {
                    main: '#D32F2F', // Candy Apple Red
                },
                secondary: {
                    main: '#FF6F00', // Burnt Orange
                },
                success: {
                    main: '#00C853', // Lime Green (used for accent in the description)
                },
                highlight: {
                    main: '#FF6F00', // Burnt Orange
                    contrastText: '#FFFFFF', // White
                },
                // You may want to define other colors like background, text, etc. for light mode
            }),
    },
}); 