import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Grid, IconButton, Paper, Stack, Table, TableBody,
    TableCell, TableHead, TableRow, TextField, Typography, Dialog,
    DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
    Select, MenuItem, LinearProgress, Alert, Switch, FormControlLabel, Tooltip, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BoltIcon from '@mui/icons-material/Bolt';
import TimerIcon from '@mui/icons-material/Timer';
import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface FlashSaleRow {
    id: number;
    title: string;
    product_name: string;
    product_uuid: string | null;
    discount_percent: number;
    max_quantity: number | null;
    sold_count: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    is_running: boolean;
    remaining_s: number;
}

interface Props extends PageProps {
    flashSales: PaginatedData<FlashSaleRow>;
}

function Countdown({ seconds }: { seconds: number }) {
    const [rem, setRem] = useState(seconds);

    useEffect(() => {
        if (rem <= 0) return;
        const t = setInterval(() => setRem(v => Math.max(0, v - 1)), 1000);
        return () => clearInterval(t);
    }, []);

    if (rem <= 0) return <Chip label="Encerrada" size="small" color="default" />;

    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    const s = rem % 60;

    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            bgcolor: alpha('#DC2626', 0.08), color: '#DC2626',
            borderRadius: 5, px: 1.5, py: 0.3, fontWeight: 800, fontSize: 13,
            fontFamily: 'monospace',
            animation: rem < 300 ? 'blink 1s infinite' : 'none',
            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        }}>
            <TimerIcon sx={{ fontSize: 14 }} />
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </Box>
    );
}

export default function FlashSalesIndex({ flashSales }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        product_id: '',
        discount_percent: 20,
        max_quantity: '',
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
    });

    const activeCount = flashSales.data.filter(f => f.is_running).length;

    return (
        <AdminLayout title="Flash Sales" breadcrumbs={[{ label: 'Marketing' }, { label: 'Flash Sales' }]}>
            <Head title="Flash Sales — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <BoltIcon sx={{ color: '#FFB300', fontSize: 28 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Flash Sales</Typography>
                        {activeCount > 0 && (
                            <Chip
                                label={`${activeCount} ativa${activeCount !== 1 ? 's' : ''} agora`}
                                color="error"
                                size="small"
                                sx={{ fontWeight: 700, animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 } } }}
                            />
                        )}
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Crie promoções relâmpago com countdown para aumentar urgência e vendas
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                    Nova Flash Sale
                </Button>
            </Stack>

            {/* Dica */}
            {flashSales.data.length === 0 && (
                <Alert severity="info" icon={<BoltIcon />} sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Como funciona?</Typography>
                    <Typography variant="caption">
                        Crie uma Flash Sale vinculada a um produto específico ou a todos os produtos em promoção.
                        O countdown aparece na página do produto e incentiva a compra imediata.
                    </Typography>
                </Alert>
            )}

            {/* Tabela */}
            <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                            {['Título', 'Produto', 'Desconto', 'Estoque', 'Período', 'Status', 'Tempo Restante', ''].map(h => (
                                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.2 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {flashSales.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                    Nenhuma Flash Sale criada ainda.
                                </TableCell>
                            </TableRow>
                        )}
                        {flashSales.data.map((fs) => (
                            <TableRow key={fs.id} hover sx={{ '& td': { py: 1.5 } }}>
                                <TableCell>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                        <BoltIcon sx={{ fontSize: 16, color: '#FFB300' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{fs.title}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }} noWrap>
                                        {fs.product_name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={`-${fs.discount_percent}%`} color="error" size="small" sx={{ fontWeight: 800 }} />
                                </TableCell>
                                <TableCell>
                                    {fs.max_quantity ? (
                                        <Box sx={{ minWidth: 100 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                {fs.sold_count}/{fs.max_quantity}
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(fs.sold_count / fs.max_quantity) * 100}
                                                sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                                                color={fs.sold_count >= fs.max_quantity ? 'error' : 'primary'}
                                            />
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>Ilimitado</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>De: {fs.starts_at}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Até: {fs.ends_at}</Typography>
                                </TableCell>
                                <TableCell>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={fs.is_active}
                                                onChange={() => router.patch(`/admin/flash-sales/${fs.id}/toggle`)}
                                                size="small"
                                            />
                                        }
                                        label=""
                                    />
                                </TableCell>
                                <TableCell>
                                    {fs.is_running ? (
                                        <Countdown seconds={fs.remaining_s} />
                                    ) : fs.is_active ? (
                                        <Chip label="Agendada" color="info" size="small" />
                                    ) : (
                                        <Chip label="Inativa" color="default" size="small" />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Excluir">
                                        <IconButton size="small" color="error" onClick={() => confirm('Excluir Flash Sale?') && router.delete(`/admin/flash-sales/${fs.id}`)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Dialog de criação */}
            <Dialog open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BoltIcon sx={{ color: '#FFB300' }} />
                    Nova Flash Sale
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Título *"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            error={!!errors.title}
                            helperText={errors.title ?? 'Ex.: "⚡ Promoção Relâmpago — 24h"'}
                            fullWidth size="small"
                        />
                        <TextField
                            label="ID do Produto (deixe vazio para todos)"
                            type="number"
                            value={data.product_id}
                            onChange={(e) => setData('product_id', e.target.value)}
                            helperText="Use o ID numérico do produto. Vazio = aplica a todos os produtos em promoção."
                            fullWidth size="small"
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Desconto adicional (%) *"
                                type="number"
                                inputProps={{ min: 1, max: 90 }}
                                value={data.discount_percent}
                                onChange={(e) => setData('discount_percent', Number(e.target.value))}
                                error={!!errors.discount_percent}
                                helperText={errors.discount_percent}
                                fullWidth size="small"
                            />
                            <TextField
                                label="Máx. unidades (vazio = ilimitado)"
                                type="number"
                                value={data.max_quantity}
                                onChange={(e) => setData('max_quantity', e.target.value)}
                                helperText="Cria barra de progresso"
                                fullWidth size="small"
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Início *"
                                type="datetime-local"
                                value={data.starts_at}
                                onChange={(e) => setData('starts_at', e.target.value)}
                                fullWidth size="small"
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField
                                label="Término *"
                                type="datetime-local"
                                value={data.ends_at}
                                onChange={(e) => setData('ends_at', e.target.value)}
                                error={!!errors.ends_at}
                                helperText={errors.ends_at}
                                fullWidth size="small"
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); reset(); }}>Cancelar</Button>
                    <Button
                        variant="contained"
                        startIcon={<BoltIcon />}
                        disabled={processing}
                        onClick={() => post('/admin/flash-sales', { onSuccess: () => { setCreateOpen(false); reset(); } })}
                        sx={{ bgcolor: '#FFB300', color: '#1A1A1A', '&:hover': { bgcolor: '#e6a200' } }}
                    >
                        Criar Flash Sale
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
