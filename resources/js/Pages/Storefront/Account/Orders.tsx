import { type ElementType } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Box, Chip, Paper, Stack, Typography, Button } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountLayout from '@/Layouts/AccountLayout';
import Pagination from '@/Components/storefront/Pagination';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface OrderRow {
    uuid: string;
    status: string;
    status_label: string;
    status_color: string;
    total_cents: number;
    items_count: number;
    placed_at: string;
    payment_status?: string;
}

interface Props extends PageProps { orders: PaginatedData<OrderRow> }

const COLOR_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

export default function Orders({ orders }: Props) {
    return (
        <AccountLayout title="Meus Pedidos">
            <Head title="Meus Pedidos" />

            {orders.data.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <ShoppingBagIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Nenhum pedido ainda</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Seus pedidos aparecerão aqui após a primeira compra.
                    </Typography>
                    <Button component={Link as ElementType} href="/categorias/energia-solar" variant="contained">
                        Explorar produtos
                    </Button>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {orders.data.map((order) => (
                        <Paper
                            key={order.uuid}
                            elevation={0}
                            sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                        >
                            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                                <Box>
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                            #{order.uuid.slice(0, 8).toUpperCase()}
                                        </Typography>
                                        <Chip label={order.status_label} color={COLOR_MAP[order.status_color] ?? 'default'} size="small" />
                                        {order.payment_status && (
                                            <Chip label={order.payment_status} variant="outlined" size="small" />
                                        )}
                                    </Stack>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {order.placed_at} · {order.items_count} {order.items_count === 1 ? 'item' : 'itens'}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        {formatBRL(order.total_cents)}
                                    </Typography>
                                    <Button
                                        component={Link as ElementType}
                                        href={`/conta/pedidos/${order.uuid}`}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Ver detalhes
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    ))}
                    <Pagination pagination={orders} />
                </Stack>
            )}
        </AccountLayout>
    );
}
