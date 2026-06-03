import { type ElementType } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Box, Chip, Grid, Paper, Stack, Typography, Button,
    Divider, Avatar,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccountLayout from '@/Layouts/AccountLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface OrderDetailData {
    uuid: string;
    status: string;
    status_label: string;
    status_color: string;
    total_cents: number;
    subtotal_cents: number;
    discount_cents: number;
    shipping_cents: number;
    shipping_address: Record<string, string>;
    placed_at: string;
    items: {
        name: string;
        sku: string;
        quantity: number;
        unit_price_cents: number;
        total_cents: number;
        cover_image?: string;
        slug?: string;
    }[];
    shipment?: {
        carrier?: string;
        tracking_code?: string;
        status: string;
        shipped_at?: string;
    } | null;
    payments: {
        method: string;
        status: string;
        status_color: string;
        amount_cents: number;
        paid_at?: string;
    }[];
}

interface Props extends PageProps { order: OrderDetailData }

const COLOR_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

export default function OrderDetail({ order }: Props) {
    return (
        <AccountLayout title={`Pedido #${order.uuid.slice(0, 8).toUpperCase()}`}>
            <Head title={`Pedido #${order.uuid.slice(0, 8).toUpperCase()}`} />

            <Stack spacing={3}>
                {/* Header */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                        <Box>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                                    #{order.uuid.slice(0, 8).toUpperCase()}
                                </Typography>
                                <Chip label={order.status_label} color={COLOR_MAP[order.status_color] ?? 'default'} />
                            </Stack>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Realizado em {order.placed_at}</Typography>
                        </Box>
                        {order.status === 'pending' && (
                            <Button component={Link as ElementType} href={`/pedidos/${order.uuid}/pagamento`} variant="contained">
                                Pagar agora
                            </Button>
                        )}
                    </Stack>
                </Paper>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* Itens */}
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Itens do pedido</Typography>
                            </Box>
                            {order.items.map((item, i) => (
                                <Box key={i}>
                                    {i > 0 && <Divider />}
                                    <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
                                        <Avatar
                                            src={item.cover_image}
                                            variant="rounded"
                                            sx={{ width: 64, height: 64, bgcolor: 'grey.100' }}
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            {item.slug ? (
                                                <Box component={Link as ElementType} href={`/produtos/${item.slug}`} sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                                    {item.name}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                                            )}
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>SKU: {item.sku}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {item.quantity}× {formatBRL(item.unit_price_cents)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(item.total_cents)}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ))}
                        </Paper>

                        {/* Rastreamento */}
                        {order.shipment && (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                                    <LocalShippingIcon color="primary" />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Rastreamento</Typography>
                                </Stack>
                                {order.shipment.tracking_code ? (
                                    <Box>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Código de rastreio:</Typography>
                                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{order.shipment.tracking_code}</Typography>
                                        {order.shipment.shipped_at && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Enviado em {order.shipment.shipped_at}</Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Seu pedido está sendo preparado para envio.</Typography>
                                )}
                            </Paper>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        {/* Resumo financeiro */}
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Resumo</Typography>
                            <Stack spacing={1}>
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                                    <Typography variant="body2">{formatBRL(order.subtotal_cents)}</Typography>
                                </Stack>
                                {order.discount_cents > 0 && (
                                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Desconto</Typography>
                                        <Typography variant="body2" sx={{ color: 'success.main' }}>−{formatBRL(order.discount_cents)}</Typography>
                                    </Stack>
                                )}
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Frete</Typography>
                                    <Typography variant="body2">{order.shipping_cents > 0 ? formatBRL(order.shipping_cents) : 'Grátis'}</Typography>
                                </Stack>
                                <Divider />
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatBRL(order.total_cents)}</Typography>
                                </Stack>
                            </Stack>
                        </Paper>

                        {/* Endereço */}
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Endereço de entrega</Typography>
                            {Object.entries(order.shipping_address).map(([k, v]) => v && (
                                <Typography key={k} variant="body2" sx={{ color: 'text.secondary' }}>{v}</Typography>
                            ))}
                        </Paper>

                        {/* Pagamentos */}
                        {order.payments.length > 0 && (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Pagamento</Typography>
                                {order.payments.map((p, i) => (
                                    <Stack key={i} spacing={0.5}>
                                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2">{p.method}</Typography>
                                            <Chip label={p.status} color={COLOR_MAP[p.status_color] ?? 'default'} size="small" />
                                        </Stack>
                                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Valor</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBRL(p.amount_cents)}</Typography>
                                        </Stack>
                                        {p.paid_at && <Typography variant="caption" sx={{ color: 'text.secondary' }}>Pago em {p.paid_at}</Typography>}
                                    </Stack>
                                ))}
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            </Stack>
        </AccountLayout>
    );
}
