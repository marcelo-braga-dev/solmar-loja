import { Head, useForm, router } from '@inertiajs/react';
import {
    Button, Paper, Stack, Typography, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, Tooltip, Alert, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';
import type { MarginTier, MarginRecalculationLog, PaginatedData } from '@/Types/catalog';

interface Props extends PageProps {
    tiers: PaginatedData<MarginTier>;
    hasActiveTiers: boolean;
    recalculationLogs: MarginRecalculationLog[];
}

function formatDateTime(value: string | null): string {
    if (!value) return '—';
    return new Date(value.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

function statusColor(status: string): 'success' | 'error' | 'info' | 'default' {
    if (status === 'success') return 'success';
    if (status === 'failed') return 'error';
    if (status === 'running') return 'info';
    return 'default';
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

export default function MarginTiersIndex({ tiers, hasActiveTiers, recalculationLogs }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<MarginTier | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    const createForm = useForm<TierFormData>(emptyForm);
    const editForm = useForm<TierFormData>(emptyForm);

    const lastLog = recalculationLogs[0] ?? null;
    const isRunning = lastLog?.status === 'running';

    // Enquanto o último recálculo estiver "processando", busca o status atualizado a cada 3s
    // (o job roda em fila/Horizon — não há resposta síncrona a esperar). Usa setInterval (não
    // setTimeout) porque "isRunning" não muda de valor entre um poll e outro enquanto o job
    // segue rodando — um setTimeout preso a essas dependências nunca seria reagendado e o
    // polling morreria depois da 1ª tentativa, mesmo com o job ainda em andamento.
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            router.reload({ only: ['recalculationLogs'], preserveScroll: true });
        }, 3000);

        return () => clearInterval(interval);
    }, [isRunning]);

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
        setRecalculating(true);
        router.post('/admin/margin-tiers/recalculate', {}, {
            preserveScroll: true,
            onFinish: () => setRecalculating(false),
            onSuccess: () => {
                // O job roda em fila — o redirect chega antes do worker registrar o "running".
                // Confere de novo em 2s para pegar a entrada de histórico assim que ela existir.
                setTimeout(() => router.reload({ only: ['recalculationLogs'], preserveScroll: true }), 2000);
            },
        });
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

                {isRunning && (
                    <Alert severity="info" icon={<CircularProgress size={18} />}>
                        Recalculando preços dos kits em segundo plano — iniciado em {formatDateTime(lastLog!.started_at)}.
                        Esta lista é atualizada automaticamente.
                    </Alert>
                )}

                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {lastLog
                            ? (lastLog.status === 'success'
                                ? `Último recálculo: ${formatDateTime(lastLog.finished_at)} — ${lastLog.updated_items} kit(s) atualizado(s)${lastLog.notes ? ` · ${lastLog.notes}` : ''}`
                                : lastLog.status === 'failed'
                                    ? `Último recálculo falhou em ${formatDateTime(lastLog.finished_at)}.`
                                    : `Recálculo em andamento desde ${formatDateTime(lastLog.started_at)}...`)
                            : 'Nenhum recálculo executado ainda.'}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={recalculating || isRunning ? <CircularProgress size={16} /> : <RefreshIcon />}
                            onClick={recalculate}
                            disabled={recalculating || isRunning}
                        >
                            {recalculating ? 'Disparando...' : isRunning ? 'Processando...' : 'Recalcular preços agora'}
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                            Nova Faixa
                        </Button>
                    </Stack>
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

            {recalculationLogs.length > 0 && (
                <>
                    <Typography variant="subtitle2" sx={{ mt: 4, mb: 1.5, fontWeight: 700 }}>
                        Histórico de Recálculos
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Início</TableCell>
                                    <TableCell>Fim</TableCell>
                                    <TableCell align="right">Kits atualizados</TableCell>
                                    <TableCell>Observação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recalculationLogs.map((log) => (
                                    <TableRow key={log.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Chip
                                                label={log.status_label}
                                                color={statusColor(log.status)}
                                                size="small"
                                                icon={log.status === 'running' ? <CircularProgress size={12} sx={{ color: 'inherit !important', ml: 1 }} /> : undefined}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{formatDateTime(log.started_at)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{formatDateTime(log.finished_at)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2">
                                                {log.status === 'running' ? '—' : `${log.updated_items} / ${log.total_items}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {log.status === 'failed' && log.errors
                                                    ? (JSON.parse(log.errors)?.fatal ?? 'Erro desconhecido')
                                                    : (log.notes ?? '—')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

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
