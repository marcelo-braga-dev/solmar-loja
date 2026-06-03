import { type ElementType } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Box, Chip, Grid, Paper, Stack, Typography, Avatar, Divider, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface CustomerDetail {
    id: number;
    name: string;
    email: string;
    verified: boolean;
    created_at: string;
    phone?: string;
    cpf_cnpj?: string;
    type?: string;
    addresses: { id: number; full: string; is_default: boolean }[];
    total_spent: number;
    orders_count: number;
    orders: { uuid: string; status: string; status_color: string; total_cents: number; placed_at: string }[];
}

interface Props extends PageProps { customer: CustomerDetail }

const COLOR_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

export default function CustomerShow({ customer }: Props) {
    return (
        <AdminLayout title={customer.name} breadcrumbs={[{ label: 'Clientes', href: '/admin/customers' }, { label: customer.name }]}>
            <Head title={`${customer.name} — Admin`} />

            <Button component={Link as ElementType} href="/admin/customers" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mb: 3 }}>Voltar</Button>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={2}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                            <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28, mx: 'auto', mb: 2 }}>
                                {customer.name[0].toUpperCase()}
                            </Avatar>
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{customer.name}</Typography>
                                {customer.verified && <VerifiedUserIcon sx={{ fontSize: 18, color: 'success.main' }} />}
                            </Stack>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{customer.email}</Typography>
                            {customer.phone && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{customer.phone}</Typography>}
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                                Cliente desde {customer.created_at}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Resumo</Typography>
                            <Stack spacing={1.5}>
                                {[
                                    ['Total comprado', formatBRL(customer.total_spent)],
                                    ['Pedidos', String(customer.orders_count)],
                                    ['CPF/CNPJ', customer.cpf_cnpj ?? '—'],
                                    ['Tipo', customer.type === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'],
                                ].map(([k, v]) => (
                                    <Stack key={k} direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{k}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Paper>

                        {customer.addresses.length > 0 && (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Endereços</Typography>
                                <Stack spacing={1}>
                                    {customer.addresses.map((a) => (
                                        <Box key={a.id} sx={{ fontSize: 13, color: 'text.secondary' }}>
                                            {a.is_default && <Chip label="Principal" size="small" color="primary" sx={{ mb: 0.5, fontSize: 10, height: 18 }} />}
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{a.full}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        )}
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Histórico de pedidos</Typography>
                        </Box>
                        {customer.orders.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>Nenhum pedido ainda.</Box>
                        ) : (
                            customer.orders.map((order, i) => (
                                <Box key={order.uuid}>
                                    {i > 0 && <Divider />}
                                    <Stack direction="row" sx={{ px: 3, py: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                #{order.uuid.slice(0, 8).toUpperCase()}
                                            </Typography>
                                            <Chip label={order.status} color={COLOR_MAP[order.status_color] ?? 'default'} size="small" />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{order.placed_at}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(order.total_cents)}</Typography>
                                            <Button component={Link as ElementType} href={`/admin/orders/${order.uuid}`} size="small" variant="outlined">Ver</Button>
                                        </Stack>
                                    </Stack>
                                </Box>
                            ))
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </AdminLayout>
    );
}
