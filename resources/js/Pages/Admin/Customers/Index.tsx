import { type ElementType } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Button, Chip, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/VerifiedUser';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface CustomerRow {
    id: number;
    name: string;
    email: string;
    phone?: string;
    orders_count: number;
    verified: boolean;
    created_at: string;
}

interface Props extends PageProps { customers: PaginatedData<CustomerRow>; filters: { q?: string } }

export default function CustomersIndex({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');

    return (
        <AdminLayout title="Clientes" breadcrumbs={[{ label: 'Operações' }, { label: 'Clientes' }]}>
            <Head title="Clientes — Admin" />

            <Box component="form" sx={{ mb: 3 }} onSubmit={(e) => { e.preventDefault(); router.get('/admin/customers', { q: search }, { preserveState: true }); }}>
                <TextField
                    size="small"
                    placeholder="Buscar por nome ou e-mail..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: 320 }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Telefone</TableCell>
                            <TableCell>Pedidos</TableCell>
                            <TableCell>Cadastro</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.data.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum cliente encontrado.</TableCell></TableRow>
                        ) : (
                            customers.data.map((customer) => (
                                <TableRow key={customer.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Box>
                                                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.name}</Typography>
                                                    {customer.verified && <VerifiedIcon sx={{ fontSize: 14, color: 'success.main' }} />}
                                                </Stack>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{customer.email}</Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{customer.phone ?? '—'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={customer.orders_count} size="small" variant="outlined" color={customer.orders_count > 0 ? 'primary' : 'default'} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{customer.created_at}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button component={Link as ElementType} href={`/admin/customers/${customer.id}`} size="small" startIcon={<VisibilityIcon fontSize="small" />}>Ver</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination pagination={customers} />
        </AdminLayout>
    );
}
