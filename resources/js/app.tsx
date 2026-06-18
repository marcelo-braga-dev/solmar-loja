import './bootstrap';
import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState, useMemo, useEffect } from 'react';

function readInitialStoreName(): string | undefined {
    try {
        const el = document.getElementById('app');
        const page = JSON.parse(el?.dataset.page ?? '{}');
        return page?.props?.branding?.store_name || undefined;
    } catch {
        return undefined;
    }
}

let appName = readInitialStoreName() || import.meta.env.VITE_APP_NAME || 'Minha Loja';

// ─── Helpers de cor ───────────────────────────────────────────────────────────

function isValidHex(color: string | undefined): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color ?? '');
}

function darken(hex: string, amount = 0.15): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, amount = 0.25): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function contrastText(hex: string): string {
    const num = parseInt(hex.slice(1), 16);
    const lum = (0.299 * (num >> 16) + 0.587 * ((num >> 8) & 0xff) + 0.114 * (num & 0xff)) / 255;
    return lum > 0.5 ? '#1A1A1A' : '#FFFFFF';
}

function buildTheme(primary: string, secondary: string) {
    return createTheme({
        palette: {
            primary: {
                main: primary,
                light: lighten(primary),
                dark: darken(primary),
                contrastText: contrastText(primary),
            },
            secondary: {
                main: secondary,
                light: lighten(secondary),
                dark: darken(secondary),
                contrastText: contrastText(secondary),
            },
            background: { default: '#F4F6FA', paper: '#FFFFFF' },
            text: { primary: '#1A1A2E', secondary: '#5A6070' },
            success: { main: '#16A34A' },
            error:   { main: '#DC2626' },
            warning: { main: '#F59E0B' },
            info:    { main: '#0284C7' },
        },
        shape: { borderRadius: 10 },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 800 }, h2: { fontWeight: 700 },
            h3: { fontWeight: 700 }, h4: { fontWeight: 600 },
            h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
                    sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: { borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'box-shadow 0.2s ease', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } },
                },
            },
            MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
            MuiChip:      { styleOverrides: { root: { fontWeight: 500 } } },
            MuiAppBar:    { styleOverrides: { root: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } } },
        },
    });
}

// ─── Wrapper reativo que vive FORA do contexto Inertia mas monitora mudanças ─

interface BrandingProps {
    initialPrimary:   string;
    initialSecondary: string;
    App:   React.ComponentType<any>;
    props: any;
}

function InertiaApp({ initialPrimary, initialSecondary, App, props }: BrandingProps) {
    const [primary,   setPrimary]   = useState(initialPrimary);
    const [secondary, setSecondary] = useState(initialSecondary);

    // Atualiza as cores ao navegar para outra página do Inertia
    useEffect(() => {
        const remove = router.on('navigate', (event) => {
            const b = (event.detail.page.props as any)?.branding;
            if (isValidHex(b?.primary_color))   setPrimary(b.primary_color);
            if (isValidHex(b?.secondary_color))  setSecondary(b.secondary_color);
            if (b?.store_name) appName = b.store_name;
        });
        return remove;
    }, []);

    const theme = useMemo(() => buildTheme(primary, secondary), [primary, secondary]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App {...props} />
        </ThemeProvider>
    );
}

// ─── Bootstrap Inertia ───────────────────────────────────────────────────────

createInertiaApp({
    title: (title) => `${title} — ${appName}`,
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        return pages[`./Pages/${name}.tsx`] as object;
    },
    setup({ el, App, props }) {
        // Lê as cores do branding direto das props iniciais (antes de qualquer render)
        const branding = (props.initialPage.props as any)?.branding ?? {};
        const initialPrimary   = isValidHex(branding.primary_color)   ? branding.primary_color   : '#0B5FFF';
        const initialSecondary = isValidHex(branding.secondary_color) ? branding.secondary_color : '#FFB300';

        createRoot(el).render(
            <InertiaApp
                initialPrimary={initialPrimary}
                initialSecondary={initialSecondary}
                App={App}
                props={props}
            />,
        );
    },
    progress: { color: '#FFB300' },
});
