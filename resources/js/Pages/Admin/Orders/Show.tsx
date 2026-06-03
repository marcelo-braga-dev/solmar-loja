import { type ElementType } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Box, Button, Chip, Grid, Paper, Stack, Typography, Avatar,
    Divider, Select, MenuItem, FormControl, InputLabel,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
   
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface OrderDetail {
    uuid: string;
    status: string;
    status_label: string;
    status_color: string;
    total_cents: number;
    subtotal_cents: number;
    discount_cents: number;
    shipping_cents: number;
    shipping_address: Record<string, string>;
    shipping_method?: string;
    notes?: string;
    placed_at: string;
    customer?: { id: number; name: string; email: string } | null;
    items: { name: string; sku: string; quantity: number; unit_price_cents: number; total_cents: number; cover_image?: string }[];
    shipment?: { id?: number; carrier?: string; service?: string; tracking_code?: string; status: string; shipped_at?: string; delivered_at?: string } | null;
    payments: { method: string; status: string; status_color: string; amount_cents: number; paid_at?: string }[];
    available_statuses: { value: string; label: string }[];
}

interface Props extends PageProps { order: OrderDetail }

const COLOR_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

export default function OrderShow({ order }: Props) {
    const [shipmentOpen, setShipmentOpen] = useState(false);

    const statusForm = useForm({ status: order.status, notes: order.notes ?? '' });
    const shipmentForm = useForm({ carrier: '', service: '', tracking_code: '', cost_cents: 0 });

    return (
        <AdminLayout title={`Pedido #${order.uuid.slice(0, 8).toUpperCase()}`} breadcrumbs={[{ label: 'Operações' }, { label: 'Pedidos', href: '/admin/orders' }, { label: '#' + order.uuid.slice(0, 8).toUpperCase() }]}>
            <Head title={`Pedido #${order.uuid.slice(0, 8).toUpperCase()} — Admin`} />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button component={Link as ElementType} href="/admin/orders" startIcon={<ArrowBackIcon />} variant="outlined">Voltar</Button>
                <Stack direction="row" spacing={2}>
                    {order.available_statuses.length > 0 && (
                        <Stack direction="row" spacing={1}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Mudar status</InputLabel>
                                <Select value={statusForm.data.status} label="Mudar status" onChange={(e) => statusForm.setData('status', e.target.value)}>
                                    <MenuItem value={order.status}>{order.status_label} (atual)</MenuItem>
                                    {order.available_statuses.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                disabled={statusForm.data.status === order.status || statusForm.processing}
                                onClick={() => statusForm.patch(`/admin/orders/${order.uuid}/status`)}
                            >
                                Atualizar
                            </Button>
                        </Stack>
                    )}
                    {!order.shipment && (
                        <Button variant="outlined" startIcon={<LocalShippingIcon />} onClick={() => setShipmentOpen(true)}>
                            Registrar Envio
                        </Button>
                    )}
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Itens do pedido</Typography>
                                <Chip label={order.status_label} color={COLOR_MAP[order.status_color] ?? 'default'} size="small" />
                            </Box>
                            {order.items.map((item, i) => (
                                <Box key={i}>
                                    {i > 0 && <Divider />}
                                    <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
                                        <Avatar src={item.cover_image} variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'grey.100' }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>SKU: {item.sku}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.quantity}× {formatBRL(item.unit_price_cents)}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(item.total_cents)}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ))}
                        </Paper>

                        {order.shipment && (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Expedição</Typography>
                                <Grid container spacing={2}>
                                    {[
                                        ['Transportadora', order.shipment.carrier],
                                        ['Serviço', order.shipment.service],
                                        ['Código de rastreio', order.shipment.tracking_code],
                                        ['Status', order.shipment.status],
                                        ['Enviado em', order.shipment.shipped_at],
                                        ['Entregue em', order.shipment.delivered_at],
                                    ].filter(([, v]) => v).map(([k, v]) => (
                                        <Grid key={k} size={{ xs: 6 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{v}</Typography>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        )}
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={2}>
                        {order.customer && (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Cliente</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customer.name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{order.customer.email}</Typography>
                                <Button component={Link as ElementType} href={`/admin/customers/${order.customer.id}`} size="small" sx={{ mt: 1, p: 0 }}>Ver perfil completo</Button>
                            </Paper>
                        )}

                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Resumo financeiro</Typography>
                            <Stack spacing={1}>
                                {[['Subtotal', order.subtotal_cents], ['Desconto', -order.discount_cents], ['Frete', order.shipping_cents]].map(([k, v]) => (
                                    <Stack key={String(k)} direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{k}</Typography>
                                        <Typography variant="body2" sx={{ color: Number(v) < 0 ? 'success.main' : 'inherit' }}>
                                            {Number(v) < 0 ? `−${formatBRL(-Number(v))}` : formatBRL(Number(v))}
                                        </Typography>
                                    </Stack>
                                ))}
                                <Divider />
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{formatBRL(order.total_cents)}</Typography>
                                </Stack>
                            </Stack>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Endereço</Typography>
                            {Object.entries(order.shipping_address).map(([k, v]) => v && (
                                <Typography key={k} variant="body2" sx={{ color: 'text.secondary' }}>{v}</Typography>
                            ))}
                        </Paper>

                        {order.payments.length > 0 && (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Pagamentos</Typography>
                                {order.payments.map((p, i) => (
                                    <Stack key={i} spacing={0.5} sx={{ mb: 1 }}>
                                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2">{p.method}</Typography>
                                            <Chip label={p.status} color={COLOR_MAP[p.status_color] ?? 'default'} size="small" />
                                        </Stack>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(p.amount_cents)}</Typography>
                                        {p.paid_at && <Typography variant="caption" sx={{ color: 'text.secondary' }}>Pago em {p.paid_at}</Typography>}
                                    </Stack>
                                ))}
                            </Paper>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            {/* Shipment dialog */}
            <Dialog open={shipmentOpen} onClose={() => setShipmentOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Registrar Envio</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Transportadora *" value={shipmentForm.data.carrier} onChange={(e) => shipmentForm.setData('carrier', e.target.value)} fullWidth size="small" />
                        <TextField label="Serviço" value={shipmentForm.data.service} onChange={(e) => shipmentForm.setData('service', e.target.value)} fullWidth size="small" />
                        <TextField label="Código de rastreio" value={shipmentForm.data.tracking_code} onChange={(e) => shipmentForm.setData('tracking_code', e.target.value)} fullWidth size="small" />
                        <TextField label="Custo do frete (centavos)" type="number" value={shipmentForm.data.cost_cents} onChange={(e) => shipmentForm.setData('cost_cents', Number(e.target.value))} fullWidth size="small" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShipmentOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={shipmentForm.processing}
                        onClick={() => shipmentForm.post(`/admin/orders/${order.uuid}/shipment`, { onSuccess: () => setShipmentOpen(false) })}
                    >
                        Registrar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
