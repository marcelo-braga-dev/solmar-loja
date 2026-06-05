import { Head, Link } from '@inertiajs/react';
import {
    Box, Button, Paper, Stack, Typography, Grid, Chip, Avatar, Divider, alpha,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import type { PageProps } from '@inertiajs/react';
import AccountLayout from '@/Layouts/AccountLayout';
import { formatBRL } from '@/Lib/formatters';

interface Stats {
    orders: number;
    favorites: number;
    addresses: number;
}

interface RecentOrder {
    uuid: string;
    status_label: string;
    status_color: string;
    total_cents: number;
    placed_at: string;
}

interface Props extends PageProps {
    user: { id: number; name: string; email: string; email_verified_at: string | null };
    customer: { phone?: string; cpf_cnpj?: string; type?: string } | null;
    stats: Stats;
    recentOrders?: RecentOrder[];
}

const COLOR_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

export default function AccountDashboard({ user, customer, stats, recentOrders = [] }: Props) {
    const isVerified = !!user.email_verified_at;
    const firstName = user.name.split(' ')[0];

    return (
        <AccountLayout title="Minha Conta">
            <Head title="Minha Conta" />

            <Stack spacing={3}>
                {/* Alert e-mail não verificado */}
                {!isVerified && (
                    <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 2.5 }}>
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Verifique seu e-mail</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Confirme seu e-mail para aproveitar todos os recursos da sua conta.
                                </Typography>
                            </Box>
                            <Button component={Link} href="/verify-email" variant="contained" color="warning" size="small">Verificar</Button>
                        </Stack>
                    </Paper>
                )}

                {/* Saudação */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #0D1B3E 0%, #0B5FFF 100%)',
                    borderRadius: 3, p: 3, position: 'relative', overflow: 'hidden',
                }}>
                    <Box sx={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                        <Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, mb: 0.3 }}>Bem-vindo de volta,</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>{firstName}! 👋</Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, mt: 0.5 }}>{user.email}</Typography>
                        </Box>
                        <Avatar sx={{
                            width: 56, height: 56, fontSize: 22, fontWeight: 800,
                            background: 'linear-gradient(135deg, #FFB300, #FF8C00)',
                            color: 'white',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        }}>
                            {firstName[0]?.toUpperCase()}
                        </Avatar>
                    </Stack>
                </Box>

                {/* KPIs */}
                <Grid container spacing={2}>
                    {[
                        { icon: <ShoppingBagIcon />, label: 'Pedidos', value: stats.orders, color: '#0B5FFF', href: '/conta/pedidos', gradient: 'linear-gradient(135deg,#0B5FFF,#4D8DFF)' },
                        { icon: <FavoriteIcon />, label: 'Favoritos', value: stats.favorites, color: '#DC2626', href: '/conta/favoritos', gradient: 'linear-gradient(135deg,#DC2626,#F87171)' },
                        { icon: <LocationOnIcon />, label: 'Endereços', value: stats.addresses, color: '#059669', href: '/conta/enderecos', gradient: 'linear-gradient(135deg,#059669,#34D399)' },
                    ].map((stat) => (
                        <Grid key={stat.label} size={{ xs: 4 }}>
                            <Paper
                                component={Link}
                                href={stat.href}
                                elevation={0}
                                sx={{
                                    p: 2.5, display: 'block', textDecoration: 'none',
                                    border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5,
                                    transition: 'all 0.18s',
                                    '&:hover': {
                                        borderColor: alpha(stat.color, 0.3),
                                        bgcolor: alpha(stat.color, 0.03),
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 8px 24px ${alpha(stat.color, 0.12)}`,
                                    },
                                }}
                            >
                                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: stat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', mb: 1.5 }}>
                                    {stat.icon}
                                </Box>
                                <Typography sx={{ fontWeight: 900, fontSize: 26, lineHeight: 1, color: 'text.primary' }}>{stat.value}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3, fontSize: 13 }}>{stat.label}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Últimos pedidos (se houver) */}
                {recentOrders.length > 0 && (
                    <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5, overflow: 'hidden' }}>
                        <Stack direction="row" sx={{ px: 2.5, py: 2, justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Últimos Pedidos</Typography>
                            <Box component={Link} href="/conta/pedidos" sx={{ fontSize: 13, color: 'primary.main', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Ver todos <ArrowForwardIcon sx={{ fontSize: 14 }} />
                            </Box>
                        </Stack>
                        <Stack divider={<Divider />}>
                            {recentOrders.map((order) => (
                                <Stack
                                    key={order.uuid}
                                    component={Link}
                                    href={`/conta/pedidos/${order.uuid}`}
                                    direction="row"
                                    sx={{ px: 2.5, py: 1.8, justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: '#F8FAFF' }, transition: 'bgcolor 0.1s' }}
                                >
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, color: 'text.secondary' }}>
                                            #{order.uuid.slice(0, 8).toUpperCase()}
                                        </Typography>
                                        <Chip label={order.status_label} color={COLOR_MAP[order.status_color] ?? 'default'} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
                                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>{order.placed_at}</Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBRL(order.total_cents)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Paper>
                )}

                {/* Dados e Segurança */}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5, height: '100%' }}>
                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Meus Dados</Typography>
                                <Button component={Link} href="/conta/perfil" size="small" variant="outlined" sx={{ fontSize: 12 }}>Editar</Button>
                            </Stack>
                            <Stack spacing={1.2}>
                                {[
                                    { label: 'Nome', value: user.name },
                                    { label: 'E-mail', value: user.email, badge: isVerified ? 'Verificado' : null },
                                    { label: 'Telefone', value: customer?.phone ?? '—' },
                                    { label: 'CPF/CNPJ', value: customer?.cpf_cnpj ?? '—' },
                                ].map((item) => (
                                    <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                                        <Typography sx={{ color: 'text.secondary', fontSize: 12, minWidth: 72 }}>{item.label}:</Typography>
                                        <Typography sx={{ fontWeight: 500, fontSize: 13 }} noWrap>{item.value}</Typography>
                                        {item.badge && <Chip label={item.badge} color="success" size="small" icon={<VerifiedUserIcon style={{ fontSize: 11 }} />} sx={{ height: 18, fontSize: 10 }} />}
                                    </Stack>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5, height: '100%' }}>
                            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
                                <ShieldIcon color="primary" sx={{ fontSize: 18 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Segurança</Typography>
                            </Stack>
                            <Stack spacing={1.5}>
                                {[
                                    { label: 'E-mail', status: isVerified ? 'Verificado' : 'Não verificado', ok: isVerified, href: '/verify-email' },
                                    { label: 'Senha', status: 'Configurada', ok: true, href: '/conta/seguranca' },
                                ].map((item) => (
                                    <Stack key={item.label} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>{item.label}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Chip
                                                label={item.status}
                                                size="small"
                                                color={item.ok ? 'success' : 'warning'}
                                                variant="outlined"
                                                sx={{ fontSize: 11, height: 20 }}
                                            />
                                            {!item.ok && (
                                                <Button component={Link} href={item.href} size="small" sx={{ fontSize: 11, py: 0, minWidth: 0 }}>Verificar</Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                ))}
                                <Divider />
                                <Button component={Link} href="/conta/seguranca" variant="outlined" size="small" fullWidth>
                                    Configurações de Segurança
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Atalhos */}
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>Atalhos</Typography>
                    <Grid container spacing={1.5}>
                        {[
                            { label: 'Meus Pedidos', href: '/conta/pedidos', icon: '📦' },
                            { label: 'Favoritos', href: '/conta/favoritos', icon: '❤️' },
                            { label: 'Endereços', href: '/conta/enderecos', icon: '📍' },
                            { label: 'Segurança', href: '/conta/seguranca', icon: '🔒' },
                        ].map((s) => (
                            <Grid key={s.href} size={{ xs: 6, sm: 3 }}>
                                <Box
                                    component={Link}
                                    href={s.href}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                                        borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)',
                                        textDecoration: 'none', color: 'text.primary',
                                        transition: 'all 0.15s',
                                        '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.200', color: 'primary.main' },
                                    }}
                                >
                                    <Typography sx={{ fontSize: 18 }}>{s.icon}</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{s.label}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Stack>
        </AccountLayout>
    );
}
