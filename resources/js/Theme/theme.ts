import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#0B5FFF',
            light: '#4D8DFF',
            dark: '#0040CC',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#FFB300',
            light: '#FFD54F',
            dark: '#E65100',
            contrastText: '#1A1A1A',
        },
        background: {
            default: '#F4F6FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A1A2E',
            secondary: '#5A6070',
        },
        success: { main: '#16A34A' },
        error: { main: '#DC2626' },
        warning: { main: '#F59E0B' },
        info: { main: '#0284C7' },
    },
    shape: {
        borderRadius: 10,
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 800 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                },
                sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
                },
            },
        },
        MuiTextField: {
            defaultProps: { variant: 'outlined', size: 'small' },
        },
        MuiChip: {
            styleOverrides: {
                root: { fontWeight: 500 },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
            },
        },
    },
});
