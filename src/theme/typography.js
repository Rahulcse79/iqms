/**
 * IQMS Application Typography Configuration
 * Centralized typography definitions matching original CSS
 */

const typography = {
  // Font family matching original CSS
  fontFamily: [
    '"Inter"',
    '"Space Grotesk"',
    'system-ui',
    '-apple-system',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  
  // Font family for code blocks
  fontFamilyMonospace: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ].join(','),
  
  // Heading styles
  h1: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.005em',
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  
  // Body text
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  
  // Subtitle styles
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  
  // Button text
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.75,
    textTransform: 'none',  // Disable uppercase transformation
    letterSpacing: '0.02em',
  },
  
  // Caption text
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  
  // Overline text
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};

export default typography;
