import { Head, useForm, router } from '@inertiajs/react';
import {
    Button, Paper, Stack, Typography, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, Tooltip, Alert, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';
import type { MarginTier, PaginatedData } from '@/Types/catalog';

interface Props extends PageProps {
    tiers: PaginatedData<MarginTier>;
    hasActiveTiers: boolean;
}

interface TierFormData {
    min_kwp: string;
    max_kwp: string;
    margin_percent: string;
    is_active: boolean;
}

const emptyForm: TierFormData = { min_kwp: '', max_kwp: '', margin_percent: '', is_active: true };

function formatKwp(value: number | null): string {
    return value === null ? '∞' : `${value} kWp`;
}

export default function MarginTiersIndex({ tiers, hasActiveTiers }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<MarginTier | null>(null);

    const createForm = useForm<TierFormData>(emptyForm);
    const editForm = useForm<TierFormData>(emptyForm);

    const openEdit = (tier: MarginTier) => {
        setEditTarget(tier);
        editForm.setData({
            min_kwp: String(tier.min_kwp),
            max_kwp: tier.max_kwp === null ? '' : String(tier.max_kwp),
            margin_percent: String(tier.margin_percent),
            is_active: tier.is_active,
        });
    };

    const recalculate = () => {
        router.post('/admin/margin-tiers/recalculate', {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Margens de Venda" breadcrumbs={[{ label: 'Catálogo' }, { label: 'Margens de Venda' }]}>
            <Head title="Margens de Venda — Admin" />

            <Stack spacing={2} sx={{ mb: 3 }}>
                <Alert severity="info">
                    O preço de venda de cada kit é calculado como <strong>preço do fornecedor + margem</strong> da
                    faixa de potência (kWp) correspondente. Um kit cuja potência caia fora de todas as faixas usa a
                    margem da faixa mais próxima. Alterar uma faixa recalcula os preços afetados automaticamente.
                </Alert>

                {!hasActiveTiers && (
                    <Alert severity="warning">
                        Nenhuma faixa de margem ativa cadastrada — os preços dos kits estão usando o valor do
                        fornecedor diretamente até que pelo menos uma faixa seja criada.
                    </Alert>
                )}

                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={recalculate}>
                        Recalcular preços agora
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                        Nova Faixa
                    </Button>
                </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Faixa de potência</TableCell>
                            <TableCell>Margem</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tiers.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    Nenhuma faixa de margem cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tiers.data.map((tier) => (
                                <TableRow key={tier.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {tier.min_kwp} kWp — {formatKwp(tier.max_kwp)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={`${tier.margin_percent}%`} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tier.is_active ? 'Ativa' : 'Inativa'}
                                            color={tier.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                            <Tooltip title="Editar">
                                                <IconButton size="small" onClick={() => openEdit(tier)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => confirm(`Excluir a faixa de ${tier.min_kwp} a ${formatKwp(tier.max_kwp)}?`) && router.delete(`/admin/margin-tiers/${tier.id}`)}
                                                >
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

            {/* Create */}
            <Dialog open={createOpen} onClose={() => { setCreateOpen(false); createForm.reset(); createForm.clearErrors(); }} maxWidth="xs" fullWidth>
                <DialogTitle>Nova Faixa de Margem</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Potência mínima *" type="number" fullWidth autoFocus
                            value={createForm.data.min_kwp}
                            onChange={(e) => createForm.setData('min_kwp', e.target.value)}
                            error={!!createForm.errors.min_kwp} helperText={createForm.errors.min_kwp}
                            slotProps={{ input: { endAdornment: <InputAdornment position="end">kWp</InputAdornment> } }}
                        />
                        <TextField
                            label="Potência máxima" type="number" fullWidth
                            value={createForm.data.max_kwp}
                            onChange={(e) => createForm.setData('max_kwp', e.target.value)}
                            error={!!createForm.errors.max_kwp} helperText={createForm.errors.max_kwp || 'Vazio = sem limite superior (faixa mais alta)'}
                            slotProps={{ input: { endAdornment: <InputAdornment position="end">kWp</InputAdornment> } }}
                        />
                        <TextField
                            label="Margem de venda *" type="number" fullWidth
                            value={createForm.data.margin_percent}
                            onChange={(e) => createForm.setData('margin_percent', e.target.value)}
                            error={!!createForm.errors.margin_percent} helperText={createForm.errors.margin_percent}
                            slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                        />
                        <FormControlLabel control={<Switch checked={createForm.data.is_active} onChange={(e) => createForm.setData('is_active', e.target.checked)} />} label="Ativa" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); createForm.reset(); createForm.clearErrors(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={createForm.processing}
                        onClick={() => createForm.post('/admin/margin-tiers', { onSuccess: () => { setCreateOpen(false); createForm.reset(); } })}
                    >
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit */}
            <Dialog open={!!editTarget} onClose={() => { setEditTarget(null); editForm.reset(); editForm.clearErrors(); }} maxWidth="xs" fullWidth>
                <DialogTitle>Editar Faixa de Margem</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Potência mínima *" type="number" fullWidth
                            value={editForm.data.min_kwp}
                            onChange={(e) => editForm.setData('min_kwp', e.target.value)}
                            error={!!editForm.errors.min_kwp} helperText={editForm.errors.min_kwp}
                            slotProps={{ input: { endAdornment: <InputAdornment position="end">kWp</InputAdornment> } }}
                        />
                        <TextField
                            label="Potência máxima" type="number" fullWidth
                            value={editForm.data.max_kwp}
                            onChange={(e) => editForm.setData('max_kwp', e.target.value)}
                            error={!!editForm.errors.max_kwp} helperText={editForm.errors.max_kwp || 'Vazio = sem limite superior (faixa mais alta)'}
                            slotProps={{ input: { endAdornment: <InputAdornment position="end">kWp</InputAdornment> } }}
                        />
                        <TextField
                            label="Margem de venda *" type="number" fullWidth
                            value={editForm.data.margin_percent}
                            onChange={(e) => editForm.setData('margin_percent', e.target.value)}
                            error={!!editForm.errors.margin_percent} helperText={editForm.errors.margin_percent}
                            slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                        />
                        <FormControlLabel control={<Switch checked={editForm.data.is_active} onChange={(e) => editForm.setData('is_active', e.target.checked)} />} label="Ativa" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setEditTarget(null); editForm.reset(); editForm.clearErrors(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={editForm.processing}
                        onClick={() => editTarget && editForm.put(`/admin/margin-tiers/${editTarget.id}`, { onSuccess: () => { setEditTarget(null); editForm.reset(); } })}
                    >
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
