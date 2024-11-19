// themes.js
import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f2644', // Main brand color
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f9961b', // Accent color
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa', // Ultra-light background for clean aesthetics
      paper: '#ffffff', // Paper background for clarity
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4d4d4d', // Softer secondary text for readability
    },
  },
  typography: {
    fontFamily: '"Roboto", sans-serif', // Clean, modern, professional font
    h1: {
      fontWeight: 500, // Slimmer weight for a more professional look
      fontSize: '3rem', // Reduced size for a more balanced appearance
      letterSpacing: '-0.5px',
      color: '#0f2644',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2.5rem',
      letterSpacing: '-0.4px',
      color: '#0f2644',
    },
    h3: {
      fontWeight: 400,
      fontSize: '2rem',
      color: '#0f2644',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.75rem',
      color: '#0f2644',
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.5rem',
      color: '#0f2644',
    },
    h6: {
      fontWeight: 400,
      fontSize: '1.25rem',
      color: '#f9961b',
    },
    button: {
      textTransform: 'none', // Disable uppercase for a cleaner look
      fontWeight: 500,
      fontSize: '1rem',
      letterSpacing: '0.3px',
      color: '#ffffff',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: '1.6',
      color: '#1a1a1a',
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: '1.5',
      color: '#4d4d4d',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px', // Smooth, modern look
          padding: '10px 20px', // Spacious padding for better usability
          background: 'linear-gradient(135deg, #0f2644 0%, #1f3d5a 100%)', // Gradient for depth
          color: '#ffffff',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', // Softer, more refined shadow
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #f9961b 0%, #ffbb57 100%)', // Smooth hover effect
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)', // Stronger shadow on hover
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            '& fieldset': {
              borderColor: '#ccc',
            },
            '&:hover fieldset': {
              borderColor: '#0f2644', // Primary color on hover
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f9961b', // Secondary color when focused
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0f2644 0%, #1f3d5a 100%)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Softer shadow for the AppBar
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          marginBottom: '20px',
          borderBottom: '2px solid #0f2644',
          background: 'linear-gradient(to bottom, #ffffff, #f5f7fa)', // Subtle gradient
        },
        indicator: {
          height: '4px',
          backgroundColor: '#f9961b', // Accent color for indicator
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: '500',
          color: '#0f2644',
          padding: '12px 24px', // Spacious padding for a modern look
          '&:hover': {
            color: '#f9961b',
          },
          '&.Mui-selected': {
            color: '#f9961b',
            fontWeight: '600',
            backgroundColor: 'rgba(249, 150, 27, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)', // Soft, modern shadow
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)', // Slight lift on hover
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '16px 0 0 16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', // Stronger drawer shadow
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: '8px',
          backgroundColor: '#333333',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)', // Refined tooltip shadow
          fontSize: '0.875rem',
          color: '#ffffff',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Softer edges for icon buttons
          backgroundColor: '#f0f0f0',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Light shadow
          '&:hover': {
            backgroundColor: '#f9961b',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)', // Stronger hover state
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0', // Light border for modern look
          padding: '0px', // No padding as per your request
        },
      },
    },
  },
});














const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0f2644', // Main color of the logo
      contrastText: '#ffffff', // Light text for contrast
    },
    secondary: {
      main: '#f9961b', // Secondary color of the logo
      contrastText: '#ffffff', // Light text for contrast
    },
    background: {
      default: '#1c1c1c', // Dark background
      paper: '#2c2c2c', // Slightly lighter dark background for paper
    },
    text: {
      primary: '#ffffff', // Light text color
      secondary: '#aaaaaa', // Grey text for secondary elements
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '4rem',
      color: '#ffffff', // Light color for prominent headings
    },
    h2: {
      fontWeight: 800,
      fontSize: '3.5rem',
      color: '#ffffff', // Light color for large headings
    },
    h3: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#0f2644', // Main color for headings
    },
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
      color: '#0f2644', // Main color for headings
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#f9961b', // Secondary color for smaller headings
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#f9961b', // Secondary color for smaller headings
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      color: '#ffffff', // Light text for buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 20px',
          backgroundColor: '#0f2644', // Main color for buttons
          color: '#ffffff',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#f9961b', // Secondary color on hover
          },
        },
        containedPrimary: {
          backgroundColor: '#0f2644', // Main color for primary buttons
          color: '#ffffff',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          marginBottom: '0px',
          borderBottom: '1px solid #0f2644', // Main color for tabs border
          backgroundColor: '#2c2c2c', // Dark background for tabs
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
          color: '#ffffff', // Light text for tabs
          padding: '12px 20px',
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            color: '#f9961b', // Secondary color when selected
            borderBottom: '3px solid #f9961b', // Secondary color underline when selected
            backgroundColor: 'rgba(249, 150, 27, 0.1)', // Light orange background when selected
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#2c2c2c', // Dark background for cards
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)',
          border: '1px solid #0f2644', // Main color border for cards
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#2c2c2c', // Dark background for paper components
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)',
          border: '1px solid #0f2644', // Main color border for paper components
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '16px 0 0 16px',
          backgroundColor: '#2c2c2c', // Dark background for drawers
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)',
          border: '2px solid #0f2644', // Main color border for drawers
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          backgroundColor: '#2c2c2c', // Dark background for dialogs
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)',
          border: '2px solid #0f2644', // Main color border for dialogs
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: '8px',
          backgroundColor: '#333333', // Dark tooltip background
          color: '#ffffff', // Light text for tooltips
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
          fontSize: '0.875rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: '#3a3a3a', // Darker background for icon buttons
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#f9961b', // Secondary color on hover
          },
        },
      },
    },
  },
});


export { lightTheme, darkTheme };
