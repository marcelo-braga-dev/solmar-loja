import { Head, useForm, router } from '@inertiajs/react';
import {
    Button, Paper, Stack, Typography, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';
import type { Brand, PaginatedData } from '@/Types/catalog';

interface Props extends PageProps {
    brands: PaginatedData<Brand>;
}

export default function BrandsIndex({ brands }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Brand | null>(null);

    const createForm = useForm({ name: '', slug: '', description: '', website: '', is_active: true });
    const editForm = useForm({ name: '', slug: '', description: '', website: '', is_active: true });

    const openEdit = (brand: Brand) => {
        setEditTarget(brand);
        editForm.setData({
            name: brand.name,
            slug: brand.slug,
            description: '',
            website: brand.website ?? '',
            is_active: brand.is_active ?? true,
        });
    };

    return (
        <AdminLayout title="Marcas" breadcrumbs={[{ label: 'Catálogo' }, { label: 'Marcas' }]}>
            <Head title="Marcas — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                    Nova Marca
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Marca</TableCell>
                            <TableCell>Slug</TableCell>
                            <TableCell>Produtos</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {brands.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    Nenhuma marca cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            brands.data.map((brand) => (
                                <TableRow key={brand.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{brand.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 1 }}>
                                            {brand.slug}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={brand.products_count ?? 0} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={brand.is_active ? 'Ativa' : 'Inativa'}
                                            color={brand.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                            <Tooltip title="Editar">
                                                <IconButton size="small" onClick={() => openEdit(brand)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => confirm(`Excluir "${brand.name}"?`) && router.delete(`/admin/brands/${brand.id}`)}
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
            <Dialog open={createOpen} onClose={() => { setCreateOpen(false); createForm.reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Nova Marca</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Nome *" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} fullWidth autoFocus error={!!createForm.errors.name} helperText={createForm.errors.name} />
                        <TextField label="Slug" value={createForm.data.slug} onChange={(e) => createForm.setData('slug', e.target.value)} helperText="Vazio = gerado automaticamente" fullWidth />
                        <TextField label="Site" value={createForm.data.website} onChange={(e) => createForm.setData('website', e.target.value)} fullWidth />
                        <FormControlLabel control={<Switch checked={createForm.data.is_active} onChange={(e) => createForm.setData('is_active', e.target.checked)} />} label="Ativa" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); createForm.reset(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={createForm.processing}
                        onClick={() => createForm.post('/admin/brands', { onSuccess: () => { setCreateOpen(false); createForm.reset(); } })}
                    >
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit */}
            <Dialog open={!!editTarget} onClose={() => { setEditTarget(null); editForm.reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Marca</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Nome *" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} fullWidth />
                        <TextField label="Slug" value={editForm.data.slug} onChange={(e) => editForm.setData('slug', e.target.value)} fullWidth />
                        <TextField label="Site" value={editForm.data.website} onChange={(e) => editForm.setData('website', e.target.value)} fullWidth />
                        <FormControlLabel control={<Switch checked={editForm.data.is_active} onChange={(e) => editForm.setData('is_active', e.target.checked)} />} label="Ativa" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setEditTarget(null); editForm.reset(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={editForm.processing}
                        onClick={() => editTarget && editForm.put(`/admin/brands/${editTarget.id}`, { onSuccess: () => { setEditTarget(null); editForm.reset(); } })}
                    >
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
