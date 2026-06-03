import { Head, Link } from '@inertiajs/react';
import { Box, Button, Paper, Stack, Typography, Grid, Chip } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import type { PageProps } from '@inertiajs/react';
import AccountLayout from '@/Layouts/AccountLayout';

interface Stats {
    orders: number;
    favorites: number;
    addresses: number;
}

interface Props extends PageProps {
    user: { id: number; name: string; email: string; email_verified_at: string | null };
    customer: { phone?: string; cpf_cnpj?: string; type?: string } | null;
    stats: Stats;
}

export default function AccountDashboard({ user, customer, stats }: Props) {
    const isVerified = !!user.email_verified_at;

    return (
        <AccountLayout title="Minha Conta">
            <Head title="Minha Conta" />

            <Stack spacing={3}>
                {!isVerified && (
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 2 }}>
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

                <Grid container spacing={2}>
                    {[
                        { icon: <ShoppingBagIcon />, label: 'Pedidos', value: stats.orders, color: 'primary.main', href: '/conta/pedidos' },
                        { icon: <FavoriteIcon />, label: 'Favoritos', value: stats.favorites, color: 'error.main', href: '/conta/favoritos' },
                        { icon: <LocationOnIcon />, label: 'Endereços', value: stats.addresses, color: 'success.main', href: '/conta/enderecos' },
                    ].map((stat) => (
                        <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
                            <Paper
                                component={Link}
                                href={stat.href}
                                elevation={0}
                                sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, textDecoration: 'none', color: 'inherit', display: 'block', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }, transition: 'all 0.2s' }}
                            >
                                <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Dados da conta</Typography>
                        <Button component={Link} href="/conta/perfil" size="small" variant="outlined">Editar</Button>
                    </Stack>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>Nome:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.name}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>E-mail:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.email}</Typography>
                            {isVerified && <Chip label="Verificado" color="success" size="small" icon={<VerifiedUserIcon style={{ fontSize: 12 }} />} sx={{ height: 20, fontSize: 11 }} />}
                        </Stack>
                        {customer?.phone && (
                            <Stack direction="row" spacing={1}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>Telefone:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{customer.phone}</Typography>
                            </Stack>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </AccountLayout>
    );
}
