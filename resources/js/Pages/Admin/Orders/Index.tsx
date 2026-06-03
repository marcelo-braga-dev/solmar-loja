import { type ElementType } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Button, Chip, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Select, MenuItem,
    FormControl, InputLabel, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
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
    customer: string;
    email?: string;
    placed_at: string;
    payment?: string;
}

interface StatusOption { value: string; label: string }
interface Props extends PageProps {
    orders: PaginatedData<OrderRow>;
    filters: { q?: string; status?: string };
    statuses: StatusOption[];
}

const COLOR_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

export default function OrdersIndex({ orders, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');

    const applyFilters = (extra: Record<string, string>) => {
        router.get('/admin/orders', { q: search, ...filters, ...extra }, { preserveState: true });
    };

    return (
        <AdminLayout title="Pedidos" breadcrumbs={[{ label: 'Operações' }, { label: 'Pedidos' }]}>
            <Head title="Pedidos — Admin" />

            <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
                <Box component="form" onSubmit={(e) => { e.preventDefault(); applyFilters({}); }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por pedido ou cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 300 }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                    />
                </Box>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filters.status ?? ''} label="Status" onChange={(e) => applyFilters({ status: e.target.value })}>
                        <MenuItem value="">Todos</MenuItem>
                        {statuses.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                    </Select>
                </FormControl>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Pedido</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Pagamento</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Data</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.data.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum pedido encontrado.</TableCell></TableRow>
                        ) : (
                            orders.data.map((order) => (
                                <TableRow key={order.uuid} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                            #{order.uuid.slice(0, 8).toUpperCase()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{order.customer}</Typography>
                                        {order.email && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{order.email}</Typography>}
                                    </TableCell>
                                    <TableCell><Chip label={order.status_label} color={COLOR_MAP[order.status_color] ?? 'default'} size="small" /></TableCell>
                                    <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{order.payment ?? '—'}</Typography></TableCell>
                                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(order.total_cents)}</Typography></TableCell>
                                    <TableCell align="right"><Typography variant="caption" sx={{ color: 'text.secondary' }}>{order.placed_at}</Typography></TableCell>
                                    <TableCell align="center">
                                        <Button component={Link as ElementType} href={`/admin/orders/${order.uuid}`} size="small" startIcon={<VisibilityIcon fontSize="small" />}>
                                            Ver
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination pagination={orders} />
        </AdminLayout>
    );
}
