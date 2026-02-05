/**
 * IQMS Application Theme Context
 * Provides theme state management and switching functionality
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './index';
import GlobalStyles from './GlobalStyles';

// Theme context
const ThemeContext = createContext({
  mode: 'light',
  theme: null,
  toggleTheme: () => {},
  setMode: () => {},
});

// Custom hook to use theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Storage key for theme persistence
const THEME_STORAGE_KEY = 'app-theme';

/**
 * Get initial theme mode from localStorage or system preference
 */
const getInitialMode = () => {
  if (typeof window === 'undefined') return 'light';
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to read theme from localStorage:', e);
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

/**
 * Theme Provider Component
 * Wraps the application with MUI theme and provides theme switching
 */
export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(getInitialMode);
  
  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  
  // Set mode and persist to localStorage
  const setMode = useCallback((newMode) => {
    if (newMode !== 'light' && newMode !== 'dark') {
      console.warn('Invalid theme mode:', newMode);
      return;
    }
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
  }, []);
  
  // Toggle between light and dark mode
  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);
  
  // Sync with system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only auto-switch if user hasn't set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setModeState(e.matches ? 'dark' : 'light');
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  // Apply theme class to document root for CSS variable compatibility
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${mode}`);
    
    // Also set color-scheme for native elements
    root.style.colorScheme = mode;
  }, [mode]);
  
  // Context value
  const contextValue = useMemo(() => ({
    mode,
    theme,
    toggleTheme,
    setMode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  }), [mode, theme, toggleTheme, setMode]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles theme={theme} />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

// Re-export for convenience
export { ThemeContext };
