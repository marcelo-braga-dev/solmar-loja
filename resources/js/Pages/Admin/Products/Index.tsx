import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Button, Chip, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, IconButton, Tooltip, Avatar, Typography,
    InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { useState, type ElementType } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface ProductRow {
    id: number;
    uuid: string;
    name: string;
    sku: string;
    status: string;
    status_label: string;
    status_color: string;
    price_cents: number;
    featured: boolean;
    brand: string | null;
    cover_image: string | null;
    created_at: string;
}

interface Props extends PageProps {
    products: PaginatedData<ProductRow>;
    filters: { q?: string };
}

const STATUS_COLOR_MAP: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
    default: 'default',
    success: 'success',
    error: 'error',
    warning: 'warning',
};

export default function ProductsIndex({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/products', { q: search }, { preserveState: true });
    };

    const handleDelete = (uuid: string, name: string) => {
        if (confirm(`Excluir "${name}"?`)) {
            router.delete(`/admin/products/${uuid}`);
        }
    };

    return (
        <AdminLayout title="Produtos" breadcrumbs={[{ label: 'Catálogo' }, { label: 'Produtos' }]}>
            <Head title="Produtos — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box component="form" onSubmit={handleSearch}>
                    <TextField
                        size="small"
                        placeholder="Buscar por nome ou SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 320 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>
                <Button
                    component={Link as ElementType}
                    href="/admin/products/create"
                    variant="contained"
                    startIcon={<AddIcon />}
                >
                    Novo Produto
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Produto</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Preço</TableCell>
                            <TableCell>Marca</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    Nenhum produto encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.data.map((product) => (
                                <TableRow key={product.uuid} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                            <Avatar
                                                src={product.cover_image ?? undefined}
                                                variant="rounded"
                                                sx={{ width: 44, height: 44, bgcolor: 'grey.100' }}
                                            />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {product.name}
                                                </Typography>
                                                {product.featured && (
                                                    <Chip label="Destaque" size="small" color="warning" sx={{ fontSize: 10, height: 16 }} />
                                                )}
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 1 }}>
                                            {product.sku}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={product.status_label}
                                            color={STATUS_COLOR_MAP[product.status_color] ?? 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {formatBRL(product.price_cents)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {product.brand ?? '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                            {product.status === 'draft' ? (
                                                <Tooltip title="Publicar">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => router.post(`/admin/products/${product.uuid}/publish`)}
                                                    >
                                                        <PublishIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Despublicar">
                                                    <IconButton
                                                        size="small"
                                                        color="warning"
                                                        onClick={() => router.post(`/admin/products/${product.uuid}/unpublish`)}
                                                    >
                                                        <UnpublishedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    size="small"
                                                    component={Link as ElementType}
                                                    href={`/admin/products/${product.uuid}/edit`}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(product.uuid, product.name)}
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

            <Pagination pagination={products} />
        </AdminLayout>
    );
}
