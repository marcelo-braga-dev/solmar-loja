import { type ReactNode, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { type ElementType } from 'react';
import {
    Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, CssBaseline,
    IconButton, useTheme, useMediaQuery, Avatar, Menu,
    MenuItem, Divider, useScrollTrigger, Slide, alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import type { SharedProps } from '@/Types/inertia';

const DRAWER_WIDTH = 256;

interface NavItem { label: string; icon: ReactNode; href: string }

const NAV: NavItem[] = [
    { label: 'Dashboard',   icon: <DashboardIcon fontSize="small" />,  href: '/consultor' },
    { label: 'Propostas',   icon: <DescriptionIcon fontSize="small" />, href: '/consultor/propostas' },
    { label: 'Clientes',    icon: <PeopleIcon fontSize="small" />,      href: '/consultor/clientes' },
];

interface Props { children: ReactNode; title?: string }

export default function ConsultantLayout({ children, title = 'Painel do Consultor' }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const currentPath = window.location.pathname;

    const userName = auth.user?.name ?? 'Consultor';

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0D1B3E 0%, #0B2454 50%, #0F172A 100%)' }}>
            {/* Logo */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(135deg, rgba(11,95,255,0.25), rgba(11,95,255,0.05))' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #FFB300, #FF8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,179,0,0.35)' }}>
                        <SolarPowerIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, color: 'white', fontSize: 14, lineHeight: 1 }}>SolarHub</Typography>
                        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, textTransform: 'uppercase' }}>Portal Consultor</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Nav */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2, '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 } }}>
                <List dense disablePadding sx={{ px: 1.5 }}>
                    {NAV.map((item) => {
                        const active = currentPath === item.href || (item.href !== '/consultor' && currentPath.startsWith(item.href));
                        return (
                            <ListItem key={item.href} disablePadding sx={{ mb: 0.4 }}>
                                <ListItemButton
                                    component={Link as ElementType}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    sx={{
                                        borderRadius: '10px', py: 0.9, px: 1.5,
                                        bgcolor: active ? 'rgba(255,179,0,0.18)' : 'transparent',
                                        border: active ? '1px solid rgba(255,179,0,0.3)' : '1px solid transparent',
                                        '&:hover': { bgcolor: active ? 'rgba(255,179,0,0.22)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' },
                                        transition: 'all 0.15s',
                                        '&::before': active ? { content: '""', position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, bgcolor: '#FFB300', borderRadius: '0 2px 2px 0' } : {},
                                        position: 'relative', overflow: 'hidden',
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32, color: active ? '#FFB300' : 'rgba(255,255,255,0.45)' }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} slotProps={{ primary: { style: { fontSize: 13.5, fontWeight: active ? 600 : 400, color: active ? 'white' : 'rgba(255,255,255,0.65)' } } }} />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Footer */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Box sx={{ px: 1.5, py: 1 }}>
                    <ListItemButton component={Link as ElementType} href="/" target="_blank" sx={{ borderRadius: '10px', py: 0.8, color: 'rgba(255,255,255,0.35)', '&:hover': { color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                        <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}><OpenInNewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Ver Loja" slotProps={{ primary: { style: { fontSize: 13 } } }} />
                    </ListItemButton>
                </Box>
                <Box sx={{ mx: 1.5, mb: 1.5, p: 1.5, borderRadius: '10px', bgcolor: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.15)', display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,179,0,0.12)' } }} onClick={e => setAnchorEl(e.currentTarget as HTMLElement)}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #FFB300, #FF8C00)' }}>{userName[0]?.toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 13, lineHeight: 1.2 }} noWrap>{userName}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Consultor</Typography>
                    </Box>
                    <KeyboardArrowRightIcon sx={{ color: 'rgba(255,179,0,0.4)', fontSize: 16 }} />
                </Box>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} transformOrigin={{ horizontal: 'left', vertical: 'bottom' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2 } } }}>
                <MenuItem onClick={() => { setAnchorEl(null); router.post('/logout'); }} sx={{ color: 'error.main' }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />Sair
                </MenuItem>
            </Menu>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F1F5F9' }}>
            <CssBaseline />
            <AppBar position="fixed" elevation={0} sx={{ width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { lg: `${DRAWER_WIDTH}px` }, bgcolor: 'rgba(241,245,249,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'text.primary' }}>
                <Toolbar sx={{ gap: 2, minHeight: '60px !important' }}>
                    {isMobile && <IconButton onClick={() => setMobileOpen(true)} edge="start" size="small"><MenuIcon /></IconButton>}
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>{title}</Typography>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>{drawer}</Drawer>
            <Drawer variant="permanent" sx={{ display: { xs: 'none', lg: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }} open>{drawer}</Drawer>

            <Box component="main" sx={{ flexGrow: 1, minWidth: 0, ml: { lg: `${DRAWER_WIDTH}px` }, minHeight: '100vh', bgcolor: '#F1F5F9' }}>
                <Toolbar sx={{ minHeight: '60px !important' }} />
                <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: 'auto' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
