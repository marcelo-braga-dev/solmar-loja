import { type ReactNode, type ElementType, useState, useCallback } from 'react';
import {
    Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
    ListItemText, ListItemButton, ListItemIcon, CssBaseline,
    IconButton, useTheme, useMediaQuery, Avatar, Menu,
    MenuItem, Tooltip, Badge, Chip, Popover, Divider, CircularProgress,
    alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import BoltIcon from '@mui/icons-material/Bolt';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BusinessIcon from '@mui/icons-material/Business';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ArticleIcon from '@mui/icons-material/Article';
import StarIcon from '@mui/icons-material/Star';
import SecurityIcon from '@mui/icons-material/Security';
import PaletteIcon from '@mui/icons-material/Palette';
import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import NotificationsIcon from '@mui/icons-material/Notifications';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, router, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/Types/inertia';

const DRAWER_WIDTH = 264;

interface NavSection {
    title: string;
    items: { label: string; icon: ReactNode; href: string; badge?: number }[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Geral',
        items: [
            { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, href: '/admin' },
        ],
    },
    {
        title: 'Catálogo',
        items: [
            { label: 'Produtos', icon: <InventoryIcon fontSize="small" />, href: '/admin/products' },
            { label: 'Importar CSV', icon: <FileUploadIcon fontSize="small" />, href: '/admin/products/import' },
            { label: 'Categorias', icon: <CategoryIcon fontSize="small" />, href: '/admin/categories' },
            { label: 'Marcas', icon: <BrandingWatermarkIcon fontSize="small" />, href: '/admin/brands' },
        ],
    },
    {
        title: 'Operações',
        items: [
            { label: 'Pedidos', icon: <ShoppingCartIcon fontSize="small" />, href: '/admin/orders' },
            { label: 'Clientes', icon: <PeopleIcon fontSize="small" />, href: '/admin/customers' },
        ],
    },
    {
        title: 'Estoque',
        items: [
            { label: 'Gestão de Estoque', icon: <InventoryOutlinedIcon fontSize="small" />, href: '/admin/inventory' },
        ],
    },
    {
        title: 'Marketing',
        items: [
            { label: 'Cupons', icon: <ConfirmationNumberIcon fontSize="small" />, href: '/admin/coupons' },
            { label: 'Flash Sales', icon: <BoltIcon fontSize="small" />, href: '/admin/flash-sales' },
            { label: 'Blog — Posts', icon: <ArticleIcon fontSize="small" />, href: '/admin/posts' },
            { label: 'Blog — Categorias', icon: <ArticleIcon fontSize="small" />, href: '/admin/post-categories' },
            { label: 'Avaliações', icon: <StarIcon fontSize="small" />, href: '/admin/reviews' },
            { label: 'Newsletter', icon: <MailIcon fontSize="small" />, href: '/admin/newsletter' },
        ],
    },
    {
        title: 'Análises',
        items: [
            { label: 'Relatórios', icon: <BarChartIcon fontSize="small" />, href: '/admin/reports' },
        ],
    },
    {
        title: 'Portal B2B',
        items: [
            { label: 'Empresas',       icon: <BusinessIcon fontSize="small" />,   href: '/admin/companies' },
            { label: 'Tabelas de Preço', icon: <LocalOfferIcon fontSize="small" />, href: '/admin/price-lists' },
        ],
    },
    {
        title: 'Atendimento',
        items: [
            { label: 'Suporte / Tickets', icon: <HeadsetMicIcon fontSize="small" />, href: '/admin/tickets' },
            { label: 'Cotações', icon: <ConfirmationNumberIcon fontSize="small" />, href: '/admin/quotes' },
            { label: 'Devoluções / RMA', icon: <InventoryOutlinedIcon fontSize="small" />, href: '/admin/returns' },
        ],
    },
    {
        title: 'Integrações',
        items: [
            { label: 'ERP / API Externa', icon: <SyncIcon fontSize="small" />, href: '/admin/integration' },
        ],
    },
    {
        title: 'Sistema',
        items: [
            { label: 'Configurações', icon: <SettingsIcon fontSize="small" />, href: '/admin/settings' },
            { label: 'Menu Principal', icon: <MenuIcon fontSize="small" />, href: '/admin/menu-items' },
            { label: 'Identidade Visual', icon: <PaletteIcon fontSize="small" />, href: '/admin/branding' },
            { label: 'Autenticação 2FA', icon: <SecurityIcon fontSize="small" />, href: '/two-factor/setup' },
        ],
    },
];

interface Props {
    children: ReactNode;
    title?: string;
    breadcrumbs?: { label: string; href?: string }[];
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    read: boolean;
    created_at: string;
}

export default function AdminLayout({ children, title = 'Admin', breadcrumbs }: Props) {
    const { auth, notifyCount, branding } = usePage<SharedProps>().props;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifyAnchor, setNotifyAnchor] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifyLoading, setNotifyLoading] = useState(false);
    const currentPath = window.location.pathname;

    const fetchNotifications = useCallback(async () => {
        setNotifyLoading(true);
        try {
            const res = await fetch('/admin/notifications', { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            setNotifications(data.notifications ?? []);
        } finally {
            setNotifyLoading(false);
        }
    }, []);

    const openNotifications = (e: React.MouseEvent<HTMLElement>) => {
        setNotifyAnchor(e.currentTarget);
        fetchNotifications();
    };

    const markAllRead = async () => {
        await fetch('/admin/notifications/read-all', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const userName = auth.user?.name ?? 'Admin';
    const userInitial = userName[0]?.toUpperCase() ?? 'A';

    const drawer = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0D1B3E 0%, #0F172A 60%, #111827 100%)',
            color: 'white',
        }}>
            {/* Logo */}
            <Box sx={{
                p: 2.5,
                background: 'linear-gradient(135deg, rgba(11,95,255,0.3) 0%, rgba(11,95,255,0.05) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {branding?.logo_dark_url || branding?.logo_url ? (
                        <Box
                            component="img"
                            src={branding.logo_dark_url || branding.logo_url}
                            alt={branding.store_name}
                            sx={{ height: 38, maxWidth: 120, objectFit: 'contain' }}
                        />
                    ) : (
                        <Box sx={{
                            width: 38, height: 38,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0B5FFF 0%, #4D8DFF 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(11,95,255,0.4)',
                        }}>
                            <SolarPowerIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                    )}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-0.3px' }}>
                            {branding?.store_name || 'SolarHub'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            Admin Panel
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Nav */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 } }}>
                {NAV_SECTIONS.map((section) => (
                    <Box key={section.title} sx={{ mb: 0.5 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                px: 3, pt: 1.5, pb: 0.5, display: 'block',
                                color: 'rgba(255,255,255,0.25)',
                                textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 10, fontWeight: 700,
                            }}
                        >
                            {section.title}
                        </Typography>
                        <List dense disablePadding>
                            {section.items.map((item) => {
                                const active = currentPath === item.href
                                    || (item.href !== '/admin' && currentPath.startsWith(item.href));
                                return (
                                    <ListItem key={item.href} disablePadding sx={{ px: 1.5, mb: 0.25 }}>
                                        <ListItemButton
                                            component={Link as ElementType}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            sx={{
                                                borderRadius: '10px',
                                                py: 0.9, px: 1.5,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                bgcolor: active ? 'rgba(11,95,255,0.2)' : 'transparent',
                                                border: active ? '1px solid rgba(11,95,255,0.35)' : '1px solid transparent',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: active ? 'rgba(11,95,255,0.25)' : 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                },
                                                '&::before': active ? {
                                                    content: '""',
                                                    position: 'absolute',
                                                    left: 0, top: '20%', bottom: '20%', width: 3,
                                                    bgcolor: '#4D8DFF',
                                                    borderRadius: '0 2px 2px 0',
                                                } : {},
                                            }}
                                        >
                                            <ListItemIcon sx={{
                                                minWidth: 32,
                                                color: active ? '#4D8DFF' : 'rgba(255,255,255,0.45)',
                                                transition: 'color 0.15s',
                                            }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.label}
                                                slotProps={{
                                                    primary: {
                                                        style: {
                                                            fontSize: 13.5,
                                                            fontWeight: active ? 600 : 400,
                                                            color: active ? 'white' : 'rgba(255,255,255,0.6)',
                                                            letterSpacing: active ? '-0.1px' : 'normal',
                                                        },
                                                    },
                                                }}
                                            />
                                            {item.badge ? (
                                                <Chip label={item.badge} size="small" color="error" sx={{ height: 18, fontSize: 11 }} />
                                            ) : null}
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* Bottom: ver loja + user */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Box sx={{ px: 1.5, py: 1 }}>
                    <ListItemButton
                        component={Link as ElementType}
                        href="/"
                        target="_blank"
                        sx={{
                            borderRadius: '10px', py: 0.9, px: 1.5,
                            color: 'rgba(255,255,255,0.4)',
                            border: '1px solid transparent',
                            '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' },
                            transition: 'all 0.15s',
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                            <OpenInNewIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Ver Loja" slotProps={{ primary: { style: { fontSize: 13.5, color: 'inherit' } } }} />
                    </ListItemButton>
                </Box>

                {/* User card */}
                <Box sx={{
                    mx: 1.5, mb: 1.5, p: 1.5,
                    borderRadius: '10px',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                    transition: 'bgcolor 0.15s',
                }}
                    onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
                >
                    <Avatar sx={{
                        width: 32, height: 32, fontSize: 13, fontWeight: 700,
                        background: 'linear-gradient(135deg, #0B5FFF 0%, #7C3AED 100%)',
                    }}>
                        {userInitial}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: 13, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {userName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                            Administrador
                        </Typography>
                    </Box>
                    <KeyboardArrowRightIcon sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }} />
                </Box>
            </Box>

            {/* User menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } } }}
            >
                <MenuItem component={Link} href="/two-factor/setup" onClick={() => setAnchorEl(null)}>
                    <SecurityIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                    Segurança (2FA)
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); router.post('/logout'); }} sx={{ color: 'error.main' }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Sair
                </MenuItem>
            </Menu>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F1F5F9' }}>
            <CssBaseline />

            {/* AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { lg: `${DRAWER_WIDTH}px` },
                    bgcolor: 'rgba(241,245,249,0.85)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    color: 'text.primary',
                }}
            >
                <Toolbar sx={{ gap: 2, minHeight: '60px !important' }}>
                    {isMobile && (
                        <IconButton onClick={() => setMobileOpen(true)} edge="start" size="small">
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>{title}</Typography>
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {breadcrumbs.map((b, i) => (
                                    <span key={i}>
                                        {i > 0 && ' › '}
                                        {b.href
                                            ? <Link href={b.href} style={{ color: 'inherit', textDecoration: 'none' }}>{b.label}</Link>
                                            : b.label}
                                    </span>
                                ))}
                            </Typography>
                        )}
                    </Box>

                    <Tooltip title="Notificações">
                        <IconButton
                            onClick={openNotifications}
                            size="small"
                            sx={{
                                bgcolor: 'white',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                '&:hover': { bgcolor: 'grey.50' },
                            }}
                        >
                            <Badge badgeContent={notifyCount || 0} color="error" max={99}>
                                <NotificationsIcon fontSize="small" />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Popover de notificações */}
                    <Popover
                        open={Boolean(notifyAnchor)}
                        anchorEl={notifyAnchor}
                        onClose={() => setNotifyAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { width: 380, maxHeight: 500, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', mt: 1 } } }}
                    >
                        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1 }}>Notificações</Typography>
                                {notifyCount > 0 && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{notifyCount} não lida{notifyCount !== 1 ? 's' : ''}</Typography>
                                )}
                            </Box>
                            {notifications.some(n => !n.read) && (
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                                    onClick={markAllRead}
                                >
                                    Marcar todas lidas
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                            {notifyLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : notifications.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma notificação.</Typography>
                                </Box>
                            ) : (
                                notifications.map((n, i) => (
                                    <Box key={n.id}>
                                        {i > 0 && <Divider />}
                                        <Box
                                            component={n.action_url ? Link : 'div'}
                                            {...(n.action_url ? { href: n.action_url } : {})}
                                            onClick={() => setNotifyAnchor(null)}
                                            sx={{
                                                display: 'flex', gap: 1.5,
                                                px: 2.5, py: 2,
                                                bgcolor: n.read ? 'transparent' : alpha('#0B5FFF', 0.04),
                                                textDecoration: 'none',
                                                '&:hover': { bgcolor: 'grey.50' },
                                                cursor: n.action_url ? 'pointer' : 'default',
                                            }}
                                        >
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%', mt: 0.7, flexShrink: 0,
                                                bgcolor: n.read ? 'transparent' : 'primary.main',
                                            }} />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 700, color: 'text.primary', lineHeight: 1.4 }}>
                                                    {n.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                                                    {n.message}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                                                    {n.created_at}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Popover>
                </Toolbar>
            </AppBar>

            {/* Sidebar — mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
                }}
            >
                {drawer}
            </Drawer>

            {/* Sidebar — desktop */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', lg: 'block' },
                    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
                }}
                open
            >
                {drawer}
            </Drawer>

            {/* Main */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    ml: { lg: `${DRAWER_WIDTH}px` },
                    width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
                    minHeight: '100vh',
                    bgcolor: '#F1F5F9',
                }}
            >
                <Toolbar sx={{ minHeight: '60px !important' }} />
                <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: 'auto' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
