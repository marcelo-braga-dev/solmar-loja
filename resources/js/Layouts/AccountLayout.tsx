import { type ReactNode, type ElementType } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Box, Container, Grid, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SecurityIcon from '@mui/icons-material/Security';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { SharedProps } from '@/Types/inertia';

interface Props { children: ReactNode; title: string }

const NAV_ITEMS = [
    { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, href: '/conta' },
    { label: 'Meus Pedidos', icon: <ShoppingBagIcon fontSize="small" />, href: '/conta/pedidos' },
    { label: 'Favoritos', icon: <FavoriteIcon fontSize="small" />, href: '/conta/favoritos' },
    { label: 'Endereços', icon: <LocationOnIcon fontSize="small" />, href: '/conta/enderecos' },
    { label: 'Meus Dados', icon: <PersonIcon fontSize="small" />, href: '/conta/perfil' },
    { label: 'Segurança', icon: <SecurityIcon fontSize="small" />, href: '/conta/seguranca' },
];

export default function AccountLayout({ children, title }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <StorefrontLayout>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
                                <Avatar sx={{ width: 56, height: 56, bgcolor: 'secondary.main', color: '#1A1A1A', mx: 'auto', mb: 1, fontWeight: 700, fontSize: 24 }}>
                                    {auth.user?.name?.[0]?.toUpperCase()}
                                </Avatar>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{auth.user?.name}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>{auth.user?.email}</Typography>
                            </Box>
                            <List dense disablePadding>
                                {NAV_ITEMS.map((item) => {
                                    const active = currentPath === item.href;
                                    return (
                                        <ListItem key={item.href} disablePadding>
                                            <ListItemButton
                                                component={Link as ElementType}
                                                href={item.href}
                                                sx={{ bgcolor: active ? 'primary.50' : 'transparent', borderLeft: active ? '3px solid' : '3px solid transparent', borderColor: active ? 'primary.main' : 'transparent' }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}>{item.icon}</ListItemIcon>
                                                <ListItemText primary={item.label} slotProps={{ primary: { style: { fontWeight: active ? 600 : 400, fontSize: 14 } } }} />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                                <Divider />
                                <ListItem disablePadding>
                                    <ListItemButton component="button" onClick={() => { const f = document.createElement('form'); f.method = 'POST'; f.action = '/logout'; const t = document.createElement('input'); t.type = 'hidden'; t.name = '_token'; t.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''; f.appendChild(t); document.body.appendChild(f); f.submit(); }} sx={{ color: 'error.main' }}>
                                        <ListItemText primary="Sair" slotProps={{ primary: { style: { fontSize: 14 } } }} />
                                    </ListItemButton>
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 9 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>{title}</Typography>
                        {children}
                    </Grid>
                </Grid>
            </Container>
        </StorefrontLayout>
    );
}
