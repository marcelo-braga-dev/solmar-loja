import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Button, Chip, Grid, IconButton, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface SubscriberRow {
    id: number;
    email: string;
    name: string | null;
    confirmed: boolean;
    confirmed_at: string | null;
    unsubscribed_at: string | null;
    created_at: string;
}

interface Stats { total: number; active: number; unconfirmed: number; unsubscribed: number }

interface Props extends PageProps {
    subscribers: PaginatedData<SubscriberRow>;
    stats: Stats;
    filters: Record<string, string>;
}

const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'unconfirmed', label: 'Não confirmados' },
    { value: 'unsubscribed', label: 'Cancelados' },
];

export default function NewsletterIndex({ subscribers, stats, filters }: Props) {
    const applyFilter = (key: string, value: string) =>
        router.get('/admin/newsletter', { ...filters, [key]: value }, { preserveState: true, replace: true });

    const handleDelete = (id: number, email: string) => {
        if (confirm(`Remover ${email} da lista?`)) {
            router.delete(`/admin/newsletter/${id}`);
        }
    };

    const getStatus = (sub: SubscriberRow) => {
        if (sub.unsubscribed_at) return { label: 'Cancelado', color: 'error' as const };
        if (!sub.confirmed) return { label: 'Não confirmado', color: 'warning' as const };
        return { label: 'Ativo', color: 'success' as const };
    };

    return (
        <AdminLayout>
            <Head title="Newsletter — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Newsletter</Typography>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    component="a"
                    href="/admin/newsletter/export"
                >
                    Exportar CSV
                </Button>
            </Stack>

            {/* KPIs */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total', value: stats.total, color: 'text.primary' },
                    { label: 'Ativos', value: stats.active, color: 'success.main' },
                    { label: 'Não confirmados', value: stats.unconfirmed, color: 'warning.main' },
                    { label: 'Cancelados', value: stats.unsubscribed, color: 'error.main' },
                ].map((s) => (
                    <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filtros */}
            <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                {STATUS_FILTERS.map((f) => (
                    <Chip
                        key={f.value}
                        label={f.label}
                        clickable
                        onClick={() => applyFilter('status', f.value)}
                        color={(filters.status ?? '') === f.value ? 'primary' : 'default'}
                    />
                ))}
                <TextField
                    size="small"
                    placeholder="Buscar e-mail..."
                    defaultValue={filters.q}
                    onBlur={(e) => applyFilter('q', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilter('q', (e.target as HTMLInputElement).value); }}
                    sx={{ width: 240 }}
                />
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>E-mail</TableCell>
                            <TableCell>Nome</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Confirmado em</TableCell>
                            <TableCell>Inscrito em</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subscribers.data.map((sub) => {
                            const status = getStatus(sub);
                            return (
                                <TableRow key={sub.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{sub.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{sub.name ?? '—'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={status.label} color={status.color} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {sub.confirmed_at ? new Date(sub.confirmed_at).toLocaleDateString('pt-BR') : '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Remover">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(sub.id, sub.email)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {subscribers.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhum inscrito encontrado.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Box sx={{ p: 2 }}>
                    <Pagination pagination={subscribers} />
                </Box>
            </TableContainer>
        </AdminLayout>
    );
}
