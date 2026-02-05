/**
 * IQMS Application Color Palette
 * Centralized color definitions for light and dark themes
 * These colors match the original CSS variables from DashboardLayout.css
 */

export const lightPalette = {
  mode: 'light',
  
  // Background colors
  background: {
    default: '#f9fafb',      // --bg
    paper: '#ffffff',         // --surface
    accent: '#f1f5f9',        // --surface-accent
  },
  
  // Text colors
  text: {
    primary: '#1f2937',       // --text
    secondary: '#6b7280',     // --muted
    disabled: '#9ca3af',
  },
  
  // Primary brand color (teal)
  primary: {
    main: '#14b8a6',          // --primary / --button-bg
    dark: '#0d9488',          // --button-hover
    light: '#5eead4',
    contrastText: '#f7f7f7',  // --button-text
  },
  
  // Secondary/accent color (indigo)
  secondary: {
    main: '#6366f1',          // --accent
    dark: '#4f46e5',
    light: '#818cf8',
    contrastText: '#ffffff',
  },
  
  // Error/danger colors (red)
  error: {
    main: '#f87171',          // --red
    light: '#fee2e2',         // --red-bg
    dark: '#991b1b',          // --red-text
    contrastText: '#991b1b',
  },
  
  // Success colors (green)
  success: {
    main: '#34d399',          // --green
    light: '#ecfdf5',         // --green-bg
    dark: '#065f46',          // --green-text
    contrastText: '#065f46',
  },
  
  // Info colors (blue)
  info: {
    main: '#60a5fa',          // --blue
    light: '#eff6ff',         // --blue-bg
    dark: '#1e40af',          // --blue-text
    contrastText: '#1e40af',
  },
  
  // Warning colors (amber/orange)
  warning: {
    main: '#f97316',          // --orange
    light: 'rgba(249, 115, 22, 0.1)',
    dark: '#c2410c',
    contrastText: '#ffffff',
  },
  
  // Divider/border color
  divider: 'rgba(0, 0, 0, 0.08)',  // --border
  
  // Action colors
  action: {
    active: '#1f2937',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
  
  // Custom colors for specific use cases
  custom: {
    glass: 'rgba(255, 255, 255, 0.75)',  // --glass
    purple: '#6b4ce6',
    purpleText: '#6b4ce6',
    govBlue: '#1a4d8f',  // Government portal blue
  },
};

export const darkPalette = {
  mode: 'dark',
  
  // Background colors
  background: {
    default: '#2a3c66',       // --bg
    paper: '#1e293b',         // --surface
    accent: '#273548',        // --surface-accent
  },
  
  // Text colors
  text: {
    primary: '#f1f5f9',       // --text
    secondary: '#94a3b8',     // --muted
    disabled: '#64748b',
  },
  
  // Primary brand color (cyan)
  primary: {
    main: '#06b6d4',          // --primary / --button-bg
    dark: '#0ea5a4',          // --button-hover
    light: '#22d3ee',
    contrastText: '#f7f7f7',  // --button-text
  },
  
  // Secondary/accent color (purple)
  secondary: {
    main: '#8b5cf6',          // --accent
    dark: '#7c3aed',
    light: '#a78bfa',
    contrastText: '#ffffff',
  },
  
  // Error/danger colors (red)
  error: {
    main: '#f87171',          // --red
    light: 'rgba(248, 113, 113, 0.15)',  // --red-bg
    dark: '#fee2e2',          // --red-text
    contrastText: '#fee2e2',
  },
  
  // Success colors (green)
  success: {
    main: '#4ade80',          // --green
    light: 'rgba(74, 222, 128, 0.15)',   // --green-bg
    dark: '#dcfce7',          // --green-text
    contrastText: '#dcfce7',
  },
  
  // Info colors (purple/violet in dark mode)
  info: {
    main: '#a78bfa',          // --blue
    light: 'rgba(167, 139, 250, 0.15)', // --blue-bg
    dark: '#ede9fe',          // --blue-text
    contrastText: '#ede9fe',
  },
  
  // Warning colors
  warning: {
    main: '#f97316',
    light: 'rgba(249, 115, 22, 0.15)',
    dark: '#fed7aa',
    contrastText: '#ffffff',
  },
  
  // Divider/border color
  divider: 'rgba(255, 255, 255, 0.06)',  // --border
  
  // Action colors
  action: {
    active: '#f1f5f9',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.12)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
  
  // Custom colors
  custom: {
    glass: '#1e293b88',  // --glass
    purple: '#8b5cf6',
    purpleText: '#c4b5fd',
    govBlue: '#1a4d8f',
  },
};

export default { lightPalette, darkPalette };
