/**
 * IQMS Application Theme Configuration
 * Main theme entry point - centralizes all styling
 * 
 * This theme exactly replicates the original CSS styling while providing:
 * - Centralized color management
 * - Consistent component styling
 * - Light/Dark mode support
 * - Responsive breakpoints
 * - Cross-browser compatibility
 */

import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import typography from './typography';
import breakpoints from './breakpoints';
import { lightShadows, darkShadows } from './shadows';
import getComponentOverrides from './components';

/**
 * Creates a theme object for the specified mode
 * @param {'light' | 'dark'} mode - The theme mode
 * @returns {Theme} MUI Theme object
 */
export const createAppTheme = (mode = 'light') => {
  const isLight = mode === 'light';
  const palette = isLight ? lightPalette : darkPalette;
  const shadows = isLight ? lightShadows : darkShadows;
  
  let theme = createTheme({
    palette: {
      ...palette,
      mode,
    },
    typography: {
      ...typography,
    },
    breakpoints,
    shadows,
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    transitions: {
      duration: {
        shortest: 150,
        shorter: 180,
        short: 200,
        standard: 250,
        complex: 280,
        enteringScreen: 225,
        leavingScreen: 195,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
      dialog: 99999, // Match original CSS z-index for dialogs
    },
  });
  
  // Add component overrides
  theme = createTheme(theme, {
    components: getComponentOverrides(mode),
  });
  
  // Add responsive font sizes
  theme = responsiveFontSizes(theme);
  
  // Add custom theme properties for easy access
  theme.custom = {
    sidebarWidth: 220,
    sidebarCollapsedWidth: 80,
    topbarHeight: 94,
    footerHeight: 60,
    transitionFast: '0.18s',
    transitionMedium: '0.28s',
    radiusLg: 16,
    radiusSm: 8,
  };
  
  return theme;
};

// Pre-create light and dark themes
export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

// Default export
export default createAppTheme;

// Export utility functions
export const getTheme = (mode) => mode === 'dark' ? darkTheme : lightTheme;

/**
 * CSS Variable mapping for backwards compatibility
 * Can be used to generate CSS custom properties from theme
 */
export const getCssVariables = (theme) => ({
  '--bg': theme.palette.background.default,
  '--surface': theme.palette.background.paper,
  '--surface-accent': theme.palette.background.accent,
  '--text': theme.palette.text.primary,
  '--muted': theme.palette.text.secondary,
  '--primary': theme.palette.primary.main,
  '--accent': theme.palette.secondary.main,
  '--button-bg': theme.palette.primary.main,
  '--button-hover': theme.palette.primary.dark,
  '--button-text': theme.palette.primary.contrastText,
  '--red': theme.palette.error.main,
  '--red-bg': theme.palette.error.light,
  '--red-text': theme.palette.error.dark,
  '--green': theme.palette.success.main,
  '--green-bg': theme.palette.success.light,
  '--green-text': theme.palette.success.dark,
  '--blue': theme.palette.info.main,
  '--blue-bg': theme.palette.info.light,
  '--blue-text': theme.palette.info.dark,
  '--border': theme.palette.divider,
  '--shadow': theme.shadows[1],
  '--glass': theme.palette.custom?.glass || 'rgba(255, 255, 255, 0.75)',
});
