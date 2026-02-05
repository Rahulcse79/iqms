/**
 * IQMS Application MUI Component Overrides
 * Centralized component styling to match original CSS appearance
 */

const getComponentOverrides = (mode) => ({
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      // Global styles
      '*, *::before, *::after': {
        boxSizing: 'border-box',
      },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      body: {
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: 'background-color 0.25s ease, color 0.25s ease',
      },
      // Scrollbar styling
      '::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '::-webkit-scrollbar-track': {
        background: theme.palette.mode === 'light' ? '#f1f1f1' : '#2a3c66',
        borderRadius: '10px',
      },
      '::-webkit-scrollbar-thumb': {
        background: theme.palette.mode === 'light' ? '#888' : '#4a5568',
        borderRadius: '10px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: theme.palette.mode === 'light' ? '#555' : '#718096',
      },
      // Reduce motion for accessibility
      '@media (prefers-reduced-motion: reduce)': {
        '*': {
          transition: 'none !important',
          animation: 'none !important',
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
    }),
  },
  
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      disableRipple: false,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        padding: '8px 16px',
        fontWeight: 600,
        fontSize: '0.875rem',
        textTransform: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }),
      contained: ({ theme }) => ({
        boxShadow: 'none',
        '&:hover': {
          boxShadow: theme.shadows[2],
        },
      }),
      containedPrimary: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
        },
      }),
      outlined: ({ theme }) => ({
        borderColor: theme.palette.divider,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.primary.main,
        },
      }),
      text: ({ theme }) => ({
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }),
      sizeSmall: {
        padding: '6px 12px',
        fontSize: '0.8125rem',
      },
      sizeLarge: {
        padding: '10px 20px',
        fontSize: '0.9375rem',
      },
    },
  },
  
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }),
    },
  },
  
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: theme.shadows[2],
        },
      }),
    },
  },
  
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24,
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },
  
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: 'none',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }),
      rounded: {
        borderRadius: 12,
      },
    },
  },
  
  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 16,
        minWidth: 420,
        maxWidth: '90vw',
        maxHeight: '90vh',
        boxShadow: theme.shadows[20],
        border: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  
  MuiDialogTitle: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '20px 24px 16px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.accent,
        fontSize: '1.125rem',
        fontWeight: 600,
      }),
    },
  },
  
  MuiDialogContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 24,
        backgroundColor: theme.palette.background.paper,
      }),
    },
  },
  
  MuiDialogActions: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '16px 24px 24px',
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.accent,
        gap: 12,
      }),
    },
  },
  
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      },
    },
  },
  
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
    },
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: 6,
          backgroundColor: theme.palette.background.paper,
          transition: 'all 0.2s ease',
          '& fieldset': {
            borderColor: theme.palette.divider,
          },
          '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 4px ${theme.palette.mode === 'light' 
              ? 'rgba(20, 184, 166, 0.14)' 
              : 'rgba(6, 182, 212, 0.14)'}`,
          },
        },
      }),
    },
  },
  
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 6,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.divider,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
      }),
      input: ({ theme }) => ({
        padding: '10px 12px',
        fontSize: '0.875rem',
      }),
    },
  },
  
  MuiSelect: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 6,
      }),
      select: {
        padding: '10px 12px',
      },
    },
  },
  
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontWeight: 500,
        color: theme.palette.text.primary,
        '&.Mui-focused': {
          color: theme.palette.primary.main,
        },
      }),
    },
  },
  
  MuiTable: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderCollapse: 'collapse',
      }),
    },
  },
  
  MuiTableHead: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.accent,
      }),
    },
  },
  
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: '12px',
        fontSize: '0.875rem',
      }),
      head: ({ theme }) => ({
        fontWeight: 700,
        color: theme.palette.text.secondary,
        fontSize: '0.8125rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }),
    },
  },
  
  MuiTableRow: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }),
    },
  },
  
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 9999,
        fontWeight: 500,
        fontSize: '0.75rem',
      }),
      filled: ({ theme }) => ({
        backgroundColor: theme.palette.action.selected,
      }),
    },
  },
  
  MuiBadge: {
    styleOverrides: {
      badge: ({ theme }) => ({
        fontWeight: 600,
        fontSize: '0.75rem',
      }),
    },
  },
  
  MuiTabs: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: `2px solid ${theme.palette.divider}`,
      }),
      indicator: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        height: 2,
      }),
    },
  },
  
  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        padding: '12px 20px',
        minHeight: 48,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.primary.main,
        },
        '&.Mui-selected': {
          fontWeight: 600,
          color: theme.palette.primary.main,
        },
      }),
    },
  },
  
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[17],
      }),
    },
  },
  
  MuiAppBar: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.04)',
        color: theme.palette.text.primary,
      }),
    },
  },
  
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: '90px !important',
        padding: '12px 20px',
      },
    },
  },
  
  MuiTooltip: {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'light' 
          ? 'rgba(0, 0, 0, 0.87)' 
          : 'rgba(255, 255, 255, 0.9)',
        color: theme.palette.mode === 'light' 
          ? '#fff' 
          : '#000',
        fontSize: '0.75rem',
        fontWeight: 500,
        borderRadius: 6,
        padding: '6px 12px',
      }),
      arrow: ({ theme }) => ({
        color: theme.palette.mode === 'light' 
          ? 'rgba(0, 0, 0, 0.87)' 
          : 'rgba(255, 255, 255, 0.9)',
      }),
    },
  },
  
  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        padding: '12px 16px',
      }),
      standardError: ({ theme }) => ({
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.dark,
        border: `1px solid ${theme.palette.error.main}`,
      }),
      standardSuccess: ({ theme }) => ({
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.dark,
        border: `1px solid ${theme.palette.success.main}`,
      }),
      standardWarning: ({ theme }) => ({
        backgroundColor: theme.palette.warning.light,
        color: theme.palette.warning.dark,
        border: `1px solid ${theme.palette.warning.main}`,
      }),
      standardInfo: ({ theme }) => ({
        backgroundColor: theme.palette.info.light,
        color: theme.palette.info.dark,
        border: `1px solid ${theme.palette.info.main}`,
      }),
    },
  },
  
  MuiLinearProgress: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 4,
        height: 4,
        backgroundColor: theme.palette.action.disabledBackground,
      }),
      bar: ({ theme }) => ({
        borderRadius: 4,
      }),
    },
  },
  
  MuiCircularProgress: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.primary.main,
      }),
    },
  },
  
  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderColor: theme.palette.divider,
      }),
    },
  },
  
  MuiList: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  
  MuiListItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 6,
        marginBottom: 4,
      }),
    },
  },
  
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 6,
        padding: '12px 15px',
        transition: 'background-color 0.2s, color 0.2s',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-selected': {
          backgroundColor: theme.palette.action.selected,
          '&:hover': {
            backgroundColor: theme.palette.action.selected,
          },
        },
      }),
    },
  },
  
  MuiListItemIcon: {
    styleOverrides: {
      root: ({ theme }) => ({
        minWidth: 40,
        color: 'inherit',
      }),
    },
  },
  
  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 8,
        boxShadow: theme.shadows[8],
        border: `1px solid ${theme.palette.divider}`,
        minWidth: 180,
      }),
    },
  },
  
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '10px 16px',
        fontSize: '0.875rem',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-selected': {
          backgroundColor: theme.palette.action.selected,
        },
      }),
    },
  },
  
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px !important',
        marginBottom: 8,
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '0 0 8px 0',
        },
      }),
    },
  },
  
  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.accent,
        borderRadius: 8,
        minHeight: 48,
        '&.Mui-expanded': {
          minHeight: 48,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
      }),
      content: {
        margin: '12px 0',
        '&.Mui-expanded': {
          margin: '12px 0',
        },
      },
    },
  },
  
  MuiAccordionDetails: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 16,
        borderTop: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  
  MuiSkeleton: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.action.hover,
      }),
    },
  },
  
  MuiAvatar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      }),
    },
  },
  
  MuiFormHelperText: {
    styleOverrides: {
      root: ({ theme }) => ({
        marginTop: 4,
        marginLeft: 2,
        fontSize: '0.75rem',
      }),
    },
  },
  
  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontWeight: 500,
        marginBottom: 6,
        color: theme.palette.text.primary,
      }),
    },
  },
});

export default getComponentOverrides;
