import { Head, router } from '@inertiajs/react';
import {
    Box, Button, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Avatar,
    Typography, InputAdornment, Dialog, DialogTitle, DialogContent,
    DialogActions, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface ProductStock {
    id: number;
    uuid: string;
    name: string;
    sku: string;
    status: string;
    status_label: string;
    status_color: string;
    brand?: string;
    cover_image?: string;
}

interface Props extends PageProps { products: PaginatedData<ProductStock>; filters: { q?: string } }

export default function InventoryIndex({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);

    const adjustForm = useForm({ product_id: 0, quantity: 0, reason: '' });

    const openAdjust = (product: ProductStock) => {
        setSelectedProduct(product);
        adjustForm.setData('product_id', product.id);
        setAdjustOpen(true);
    };

    return (
        <AdminLayout title="Estoque" breadcrumbs={[{ label: 'Operações' }, { label: 'Estoque' }]}>
            <Head title="Estoque — Admin" />

            <Box component="form" sx={{ mb: 3 }} onSubmit={(e) => { e.preventDefault(); router.get('/admin/inventory', { q: search }, { preserveState: true }); }}>
                <TextField
                    size="small"
                    placeholder="Buscar produto ou SKU..."
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
                            <TableCell>Produto</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Marca</TableCell>
                            <TableCell align="center">Ajuste</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.data.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum produto encontrado.</TableCell></TableRow>
                        ) : (
                            products.data.map((product) => (
                                <TableRow key={product.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                            <Avatar src={product.cover_image} variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'grey.100' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{product.name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 1 }}>{product.sku}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={product.status_label ?? product.status}
                                            size="small"
                                            color={(product.status_color as 'success' | 'default' | 'error') ?? 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{product.brand ?? '—'}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button size="small" startIcon={<TuneIcon fontSize="small" />} onClick={() => openAdjust(product)} variant="outlined">
                                            Ajustar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination pagination={products} />

            <Dialog open={adjustOpen} onClose={() => { setAdjustOpen(false); adjustForm.reset(); }} maxWidth="xs" fullWidth>
                <DialogTitle>Ajuste de Estoque</DialogTitle>
                <DialogContent>
                    {selectedProduct && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{selectedProduct.name}</Typography>
                    )}
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        <TextField
                            label="Quantidade (positivo = entrada, negativo = saída)"
                            type="number"
                            value={adjustForm.data.quantity}
                            onChange={(e) => adjustForm.setData('quantity', Number(e.target.value))}
                            fullWidth size="small"
                        />
                        <TextField
                            label="Motivo *"
                            value={adjustForm.data.reason}
                            onChange={(e) => adjustForm.setData('reason', e.target.value)}
                            fullWidth size="small"
                            placeholder="Ex.: Recebimento de mercadoria, ajuste de inventário..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setAdjustOpen(false); adjustForm.reset(); }}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={adjustForm.processing || !adjustForm.data.reason}
                        onClick={() => adjustForm.post('/admin/inventory/adjust', { onSuccess: () => { setAdjustOpen(false); adjustForm.reset(); } })}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
