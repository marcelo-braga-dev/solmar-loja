import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Button, Chip, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, IconButton, Tooltip, Avatar, Typography,
    InputAdornment, Checkbox, Snackbar, Alert, Menu, MenuItem, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { useState, useRef, type ElementType } from 'react';
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
    const [search, setSearch]           = useState(filters.q ?? '');
    const [selected, setSelected]       = useState<number[]>([]);
    const [bulkAnchor, setBulkAnchor]   = useState<null | HTMLElement>(null);
    const [snackbar, setSnackbar]       = useState<{ open: boolean; msg: string; ok: boolean }>({ open: false, msg: '', ok: true });
    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

    const allIds     = products.data.map(p => p.id);
    const allChecked = allIds.length > 0 && allIds.every(id => selected.includes(id));
    const someChecked = selected.length > 0;

    const toggleAll = () => setSelected(allChecked ? [] : allIds);
    const toggle    = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/products', { q: search }, { preserveState: true });
    };

    const handleDelete = (uuid: string, name: string) => {
        if (confirm(`Excluir "${name}"?`)) {
            router.delete(`/admin/products/${uuid}`);
        }
    };

    const runBulk = async (action: string) => {
        setBulkAnchor(null);
        if (action === 'delete' && !confirm(`Excluir ${selected.length} produto(s)? Esta ação não pode ser desfeita.`)) return;

        try {
            const res = await fetch('/admin/products/bulk', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ids: selected }),
            });
            const data = await res.json();
            setSnackbar({ open: true, msg: data.message, ok: data.success });
            if (data.success) { setSelected([]); router.reload({ only: ['products'] }); }
        } catch {
            setSnackbar({ open: true, msg: 'Erro ao executar ação em massa.', ok: false });
        }
    };

    return (
        <AdminLayout title="Produtos" breadcrumbs={[{ label: 'Catálogo' }, { label: 'Produtos' }]}>
            <Head title="Produtos — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Box component="form" onSubmit={handleSearch}>
                    <TextField
                        size="small"
                        placeholder="Buscar por nome ou SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 320 }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                    />
                </Box>
                <Stack direction="row" spacing={1.5}>
                    {someChecked && (
                        <>
                            <Chip label={`${selected.length} selecionado${selected.length !== 1 ? 's' : ''}`} color="primary" size="small" />
                            <Button
                                variant="outlined"
                                size="small"
                                endIcon={<MoreVertIcon />}
                                onClick={(e) => setBulkAnchor(e.currentTarget)}
                            >
                                Ações em massa
                            </Button>
                            <Menu anchorEl={bulkAnchor} open={Boolean(bulkAnchor)} onClose={() => setBulkAnchor(null)}>
                                <MenuItem onClick={() => runBulk('publish')}><PublishIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />Publicar selecionados</MenuItem>
                                <MenuItem onClick={() => runBulk('archive')}><UnpublishedIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />Arquivar selecionados</MenuItem>
                                <MenuItem onClick={() => runBulk('feature')}><SelectAllIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />Marcar como destaque</MenuItem>
                                <MenuItem onClick={() => runBulk('unfeature')}><SelectAllIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />Remover destaque</MenuItem>
                                <Divider />
                                <MenuItem onClick={() => runBulk('delete')} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Excluir selecionados</MenuItem>
                            </Menu>
                        </>
                    )}
                    <Button component={Link as ElementType} href="/admin/products/create" variant="contained" startIcon={<AddIcon />}>
                        Novo Produto
                    </Button>
                </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell padding="checkbox">
                                <Checkbox checked={allChecked} indeterminate={someChecked && !allChecked} onChange={toggleAll} size="small" />
                            </TableCell>
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
                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    Nenhum produto encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.data.map((product) => (
                                <TableRow key={product.uuid} hover sx={{ '&:last-child td': { border: 0 }, bgcolor: selected.includes(product.id) ? 'primary.50' : 'transparent' }}>
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={selected.includes(product.id)} onChange={() => toggle(product.id)} size="small" />
                                    </TableCell>
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

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.ok ? 'success' : 'error'} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                    {snackbar.msg}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
}
