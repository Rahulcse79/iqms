/**
 * IQMS Application Global Styles
 * Global CSS-in-JS styles that apply across the entire application
 */

import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

/**
 * Global styles component
 * Provides application-wide styling for elements not covered by MUI components
 */
const GlobalStyles = ({ theme }) => (
  <MuiGlobalStyles
    styles={{
      // Root and body
      ':root': {
        '--font-family': theme.typography.fontFamily,
        '--font-family-base': theme.typography.fontFamily,
        '--sidebar-width': `${theme.custom?.sidebarWidth || 220}px`,
        '--sidebar-collapsed-width': `${theme.custom?.sidebarCollapsedWidth || 80}px`,
        '--topbar-height': `${theme.custom?.topbarHeight || 94}px`,
        '--footer-height': `${theme.custom?.footerHeight || 60}px`,
        '--radius': theme.shape.borderRadius + 'px',
        '--radius-lg': `${theme.custom?.radiusLg || 16}px`,
        '--radius-sm': `${theme.custom?.radiusSm || 8}px`,
        '--radius-base': '8px',
        '--radius-full': '9999px',
        '--transition': '0.2s ease',
        '--transition-fast': theme.custom?.transitionFast || '0.18s',
        '--transition-medium': theme.custom?.transitionMedium || '0.28s',
        '--ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        '--duration-normal': '0.25s',
        '--max-width': '1200px',
        '--gap': '1.5rem',
        
        // Spacing variables
        '--space-2': '0.125rem',
        '--space-4': '0.25rem',
        '--space-8': '0.5rem',
        '--space-12': '0.75rem',
        '--space-16': '1rem',
        '--space-24': '1.5rem',
        
        // Font sizes
        '--font-size-xl': '1.25rem',
        '--font-weight-medium': '500',
        '--line-height-normal': '1.5',
        
        // Status colors opacity
        '--status-bg-opacity': '0.1',
        '--status-border-opacity': '0.2',
        
        // Color variables for backwards compatibility
        '--bg': theme.palette.background.default,
        '--surface': theme.palette.background.paper,
        '--surface-accent': theme.palette.background.accent,
        '--text': theme.palette.text.primary,
        '--muted': theme.palette.text.secondary,
        '--primary': theme.palette.primary.main,
        '--primary-dark': theme.palette.primary.dark,
        '--primary-hover': theme.palette.primary.dark,
        '--accent': theme.palette.secondary.main,
        '--accent-600': theme.palette.secondary.dark,
        '--button-bg': theme.palette.primary.main,
        '--button-hover': theme.palette.primary.dark,
        '--button-text': theme.palette.primary.contrastText,
        '--color-primary': theme.palette.primary.main,
        '--color-primary-hover': theme.palette.primary.dark,
        '--color-secondary': theme.palette.secondary.main,
        '--color-error': theme.palette.error.main,
        '--color-error-rgb': theme.palette.mode === 'light' ? '220, 38, 38' : '248, 113, 113',
        '--color-success': theme.palette.success.main,
        '--color-success-rgb': theme.palette.mode === 'light' ? '22, 163, 74' : '74, 222, 128',
        '--color-bg-1': theme.palette.background.default,
        '--color-border': theme.palette.divider,
        
        // Status colors
        '--red': theme.palette.error.main,
        '--red-bg': theme.palette.mode === 'light' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(248, 113, 113, 0.15)',
        '--red-hover': theme.palette.mode === 'light' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(248, 113, 113, 0.25)',
        '--red-text': theme.palette.mode === 'light' ? '#dc2626' : '#f87171',
        '--green': theme.palette.success.main,
        '--green-bg': theme.palette.mode === 'light' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(74, 222, 128, 0.15)',
        '--green-hover': theme.palette.mode === 'light' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(74, 222, 128, 0.25)',
        '--green-text': theme.palette.mode === 'light' ? '#16a34a' : '#4ade80',
        '--blue': theme.palette.info.main,
        '--blue-bg': theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(96, 165, 250, 0.15)',
        '--blue-hover': theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(96, 165, 250, 0.25)',
        '--blue-text': theme.palette.mode === 'light' ? '#2563eb' : '#60a5fa',
        '--orange': theme.palette.warning.main,
        '--orange-text': theme.palette.warning.dark,
        '--purple': '#6b4ce6',
        '--purple-text': theme.palette.mode === 'light' ? '#6b4ce6' : '#a78bfa',
        '--border': theme.palette.divider,
        '--shadow': theme.shadows[1],
        '--shadow-sm': theme.shadows[1],
        '--focus-ring': `0 0 0 3px ${theme.palette.primary.main}40`,
        '--glass': theme.palette.custom?.glass || 'rgba(255, 255, 255, 0.75)',
      },
      
      // HTML and Body
      'html, body': {
        margin: 0,
        height: '100%',
        fontFamily: theme.typography.fontFamily,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: 'background 0.25s ease, color 0.25s ease',
        overflowX: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      
      // Root element
      '#root': {
        minHeight: '100vh',
      },
      
      // Box sizing reset
      '*, *::before, *::after': {
        boxSizing: 'border-box',
      },
      
      // Custom scrollbar
      '::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '::-webkit-scrollbar-track': {
        background: theme.palette.mode === 'light' ? '#f1f1f1' : '#1e293b',
        borderRadius: '10px',
      },
      '::-webkit-scrollbar-thumb': {
        background: theme.palette.mode === 'light' ? '#888' : '#4a5568',
        borderRadius: '10px',
        '&:hover': {
          background: theme.palette.mode === 'light' ? '#555' : '#718096',
        },
      },
      
      // Links
      a: {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        transition: 'color 0.2s ease',
        '&:hover': {
          color: theme.palette.primary.dark,
        },
      },
      
      // Code blocks
      code: {
        fontFamily: theme.typography.fontFamilyMonospace,
        backgroundColor: theme.palette.action.hover,
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.875em',
      },
      
      pre: {
        fontFamily: theme.typography.fontFamilyMonospace,
        backgroundColor: theme.palette.background.accent,
        padding: '16px',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '0.875rem',
        border: `1px solid ${theme.palette.divider}`,
      },
      
      // Images
      img: {
        maxWidth: '100%',
        height: 'auto',
      },
      
      // Form elements
      'input, textarea, select': {
        fontFamily: 'inherit',
        fontSize: 'inherit',
      },
      
      // Tables
      table: {
        borderCollapse: 'collapse',
        width: '100%',
      },
      
      // Headings
      'h1, h2, h3, h4, h5, h6': {
        margin: 0,
        color: theme.palette.text.primary,
      },
      
      // Paragraphs
      p: {
        margin: 0,
        color: theme.palette.text.primary,
      },
      
      // Lists
      'ul, ol': {
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
      
      // Buttons (native)
      button: {
        fontFamily: 'inherit',
        cursor: 'pointer',
      },
      
      // Animations
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      '@keyframes fadeInOverlay': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      '@keyframes slideIn': {
        from: {
          transform: 'translateY(-20px)',
          opacity: 0,
        },
        to: {
          transform: 'translateY(0)',
          opacity: 1,
        },
      },
      '@keyframes slideInDialog': {
        from: {
          transform: 'scale(0.95)',
          opacity: 0,
        },
        to: {
          transform: 'scale(1)',
          opacity: 1,
        },
      },
      '@keyframes spin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      '@keyframes pulse': {
        '0%, 100%': { opacity: 0.6 },
        '50%': { opacity: 1 },
      },
      '@keyframes progressSlide': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
      
      // Utility classes
      '.ellipsis': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      '.spinning': {
        animation: 'spin 1s linear infinite',
      },
      '.button-text-color': {
        color: `${theme.palette.primary.contrastText} !important`,
        backgroundColor: `${theme.palette.primary.main} !important`,
      },
      
      // Accessibility - reduce motion
      '@media (prefers-reduced-motion: reduce)': {
        '*': {
          transition: 'none !important',
          animation: 'none !important',
        },
      },
      
      // Print styles
      '@media print': {
        body: {
          backgroundColor: '#ffffff',
          color: '#000000',
        },
        '.no-print': {
          display: 'none !important',
        },
      },
    }}
  />
);

export default GlobalStyles;
