import { Head, useForm, router } from '@inertiajs/react';
import {
    Button, Chip, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel, Tooltip, IconButton,
    InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface CouponRow {
    id: number;
    code: string;
    type: string;
    value: number;
    min_order_cents: number;
    max_uses?: number;
    used_count: number;
    is_active: boolean;
    is_valid: boolean;
    expires_at?: string;
}

interface Props extends PageProps { coupons: PaginatedData<CouponRow> }

const TYPE_LABELS: Record<string, string> = { percentage: '% Desconto', fixed: 'R$ Fixo', free_shipping: 'Frete Grátis' };

export default function CouponsIndex({ coupons }: Props) {
    const [createOpen, setCreateOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        code: '',
        type: 'percentage',
        value: 0,
        min_order_cents: 0,
        max_uses: '',
        starts_at: '',
        expires_at: '',
        is_active: true,
    });

    return (
        <AdminLayout title="Cupons" breadcrumbs={[{ label: 'Marketing' }, { label: 'Cupons' }]}>
            <Head title="Cupons — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Novo Cupom</Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Código</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Desconto</TableCell>
                            <TableCell>Mín. pedido</TableCell>
                            <TableCell>Usos</TableCell>
                            <TableCell>Validade</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {coupons.data.length === 0 ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum cupom cadastrado.</TableCell></TableRow>
                        ) : (
                            coupons.data.map((coupon) => (
                                <TableRow key={coupon.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'grey.100', display: 'inline-block', px: 1, borderRadius: 1 }}>
                                            {coupon.code}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{TYPE_LABELS[coupon.type]}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.type === 'fixed' ? formatBRL(coupon.value) : 'Frete Grátis'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{coupon.min_order_cents > 0 ? formatBRL(coupon.min_order_cents) : '—'}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{coupon.expires_at ?? 'Sem validade'}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={coupon.is_active ? (coupon.is_valid ? 'Ativo' : 'Expirado') : 'Inativo'} color={coupon.is_active && coupon.is_valid ? 'success' : 'default'} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                                            <Tooltip title={coupon.is_active ? 'Desativar' : 'Ativar'}>
                                                <IconButton size="small" color={coupon.is_active ? 'success' : 'default'} onClick={() => router.patch(`/admin/coupons/${coupon.id}/toggle`)}>
                                                    <ToggleOnIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton size="small" color="error" onClick={() => confirm('Excluir cupom?') && router.delete(`/admin/coupons/${coupon.id}`)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination pagination={coupons} />

            <Dialog open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Cupom</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Código *" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} error={!!errors.code} helperText={errors.code} fullWidth size="small" placeholder="SOLAR20" />
                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo *</InputLabel>
                                <Select value={data.type} label="Tipo *" onChange={(e) => setData('type', e.target.value)}>
                                    <MenuItem value="percentage">% Desconto</MenuItem>
                                    <MenuItem value="fixed">R$ Fixo</MenuItem>
                                    <MenuItem value="free_shipping">Frete Grátis</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label={data.type === 'percentage' ? 'Desconto (%)' : data.type === 'fixed' ? 'Valor do desconto' : 'Valor'}
                                type="number"
                                inputProps={{ step: data.type === 'fixed' ? '0.01' : '1', min: '0' }}
                                value={data.type === 'fixed' ? (data.value ? (data.value / 100).toFixed(2) : '') : data.value}
                                onChange={(e) => setData('value', data.type === 'fixed' ? Math.round(Number(e.target.value) * 100) : Number(e.target.value))}
                                fullWidth size="small" disabled={data.type === 'free_shipping'}
                                slotProps={data.type === 'fixed' ? { input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } } : data.type === 'percentage' ? { input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } } : {}}
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Pedido mínimo (R$)"
                                type="number"
                                inputProps={{ step: '0.01', min: '0' }}
                                value={data.min_order_cents ? (data.min_order_cents / 100).toFixed(2) : ''}
                                onChange={(e) => setData('min_order_cents', Math.round(Number(e.target.value) * 100))}
                                fullWidth size="small"
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
                            />
                            <TextField label="Máx. usos" type="number" value={data.max_uses} onChange={(e) => setData('max_uses', e.target.value)} fullWidth size="small" placeholder="Ilimitado" />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField label="Início" type="date" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
                            <TextField label="Expiração" type="date" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
                        </Stack>
                        <FormControlLabel control={<Switch checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />} label="Ativo" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); reset(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={processing} onClick={() => post('/admin/coupons', { onSuccess: () => { setCreateOpen(false); reset(); } })}>
                        Criar Cupom
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
