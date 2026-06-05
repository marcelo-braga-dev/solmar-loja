import { Head, Link, router } from '@inertiajs/react';
import { useState, type ElementType } from 'react';
import {
    Box, Button, Chip, Grid, IconButton, Paper, Stack, Table, TableBody,
    TableCell, TableHead, TableRow, TextField, Typography, InputAdornment,
    Select, MenuItem, FormControl, InputLabel, Tooltip, alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface CompanyRow {
    uuid: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string;
    type: string;
    type_label: string;
    city: string | null;
    state: string | null;
    status: string;
    status_label: string;
    status_color: string;
    price_list: string | null;
    users_count: number;
    projects_count: number;
    approved_at: string | null;
    created_at: string;
}

interface Stats { pending: number; active: number; total: number }

interface Props extends PageProps {
    companies: PaginatedData<CompanyRow>;
    stats: Stats;
    filters: { status?: string; q?: string };
}

const STATUS_COLORS: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

const TYPE_COLORS: Record<string, string> = {
    integrador: '#0B5FFF', distribuidor: '#7C3AED', engenharia: '#059669', revendedor: '#EA580C',
};

export default function CompaniesIndex({ companies, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = (f: Record<string, string>) =>
        router.get('/admin/companies', { ...filters, ...f }, { preserveState: true, replace: true });

    return (
        <AdminLayout title="Portal B2B — Empresas" breadcrumbs={[{ label: 'Portal B2B' }, { label: 'Empresas' }]}>
            <Head title="Empresas B2B — Admin" />

            {/* KPIs */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                    { label: 'Aguardando aprovação', value: stats.pending, color: '#F59E0B', gradient: 'linear-gradient(135deg,#F59E0B,#D97706)' },
                    { label: 'Empresas ativas',      value: stats.active,  color: '#059669', gradient: 'linear-gradient(135deg,#059669,#047857)' },
                    { label: 'Total cadastrado',     value: stats.total,   color: '#0B5FFF', gradient: 'linear-gradient(135deg,#0B5FFF,#0040CC)' },
                ].map(kpi => (
                    <Grid key={kpi.label} size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ p: 2.5, borderRadius: 3, background: kpi.gradient, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                            <Typography sx={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>{kpi.value}</Typography>
                            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{kpi.label}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            {/* Filtros */}
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <Stack direction="row" spacing={1.5}>
                    <TextField
                        size="small" placeholder="Razão social, CNPJ, contato..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyFilters({ q: search })}
                        sx={{ width: 280 }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="pending">Aguardando</MenuItem>
                            <MenuItem value="active">Ativos</MenuItem>
                            <MenuItem value="suspended">Suspensos</MenuItem>
                            <MenuItem value="rejected">Reprovados</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Stack>

            <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                            {['Empresa', 'CNPJ', 'Tipo', 'Status', 'Tabela Preço', 'Membros', 'Projetos', 'Desde', ''].map(h => (
                                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', py: 1.2 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {companies.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                    <BusinessIcon sx={{ fontSize: 40, mb: 1, display: 'block', mx: 'auto', opacity: 0.3 }} />
                                    Nenhuma empresa encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                        {companies.data.map(c => (
                            <TableRow key={c.uuid} hover sx={{ '& td': { py: 1.5 } }}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.razao_social}</Typography>
                                    {c.nome_fantasia && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{c.nome_fantasia}</Typography>}
                                    {(c.city || c.state) && <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', fontSize: 11 }}>{[c.city, c.state].filter(Boolean).join('/')}</Typography>}
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{c.cnpj}</TableCell>
                                <TableCell>
                                    <Chip label={c.type_label} size="small" sx={{ bgcolor: alpha(TYPE_COLORS[c.type] ?? '#6B7280', 0.1), color: TYPE_COLORS[c.type] ?? '#6B7280', fontWeight: 600, fontSize: 11 }} />
                                </TableCell>
                                <TableCell>
                                    <Chip label={c.status_label} color={STATUS_COLORS[c.status_color] ?? 'default'} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{c.price_list ?? '—'}</TableCell>
                                <TableCell align="center">{c.users_count}</TableCell>
                                <TableCell align="center">{c.projects_count}</TableCell>
                                <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{c.created_at}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="Ver empresa">
                                            <IconButton size="small" component={Link as ElementType} href={`/admin/companies/${c.uuid}`}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {c.status === 'pending' && (
                                            <Tooltip title="Aprovar">
                                                <IconButton size="small" color="success" onClick={() => router.post(`/admin/companies/${c.uuid}/approve`)}>
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Box sx={{ p: 2 }}>
                    <Pagination pagination={companies} />
                </Box>
            </Paper>
        </AdminLayout>
    );
}
