import { Head, useForm } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Paper, Stack, Switch, FormControlLabel, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    posts_count: number;
}

interface Props extends PageProps { categories: Category[] }

export default function BlogCategories({ categories }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);

    const createForm = useForm({ name: '', slug: '', description: '', is_active: true });
    const editForm   = useForm({ name: '', description: '', is_active: true });

    const openEdit = (cat: Category) => {
        setEditTarget(cat);
        editForm.setData({ name: cat.name, description: cat.description ?? '', is_active: cat.is_active });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/post-categories', {
            onSuccess: () => { setCreateOpen(false); createForm.reset(); },
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(`/admin/post-categories/${editTarget.id}`, {
            onSuccess: () => setEditTarget(null),
        });
    };

    const handleDelete = (cat: Category) => {
        if (confirm(`Excluir categoria "${cat.name}"?`)) {
            router.delete(`/admin/post-categories/${cat.id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Categorias do Blog — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Button component={Link} href="/admin/posts" variant="outlined" size="small">← Posts</Button>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Categorias do Blog</Typography>
                </Stack>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                    Nova categoria
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Nome</TableCell>
                            <TableCell>Slug</TableCell>
                            <TableCell>Posts</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((cat) => (
                            <TableRow key={cat.id} hover>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{cat.name}</Typography>
                                    {cat.description && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{cat.description}</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{cat.slug}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={cat.posts_count} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={cat.is_active ? 'Ativa' : 'Inativa'}
                                        color={cat.is_active ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Editar">
                                        <IconButton size="small" onClick={() => openEdit(cat)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            disabled={cat.posts_count > 0}
                                            onClick={() => handleDelete(cat)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma categoria.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog criar */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Nova categoria</DialogTitle>
                <DialogContent>
                    <Box component="form" id="create-cat" onSubmit={handleCreate} sx={{ mt: 1 }}>
                        <Stack spacing={2}>
                            {createForm.errors.name && <Alert severity="error">{createForm.errors.name}</Alert>}
                            <TextField label="Nome" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} fullWidth required autoFocus />
                            <TextField label="Slug (opcional)" value={createForm.data.slug} onChange={(e) => createForm.setData('slug', e.target.value)} fullWidth helperText="Deixe vazio para gerar automaticamente" />
                            <TextField label="Descrição" value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} fullWidth multiline rows={2} />
                            <FormControlLabel
                                control={<Switch checked={createForm.data.is_active} onChange={(e) => createForm.setData('is_active', e.target.checked)} color="success" />}
                                label="Ativa"
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    <Button form="create-cat" type="submit" variant="contained" disabled={createForm.processing}>Criar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog editar */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Editar categoria</DialogTitle>
                <DialogContent>
                    <Box component="form" id="edit-cat" onSubmit={handleUpdate} sx={{ mt: 1 }}>
                        <Stack spacing={2}>
                            <TextField label="Nome" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} fullWidth required autoFocus />
                            <TextField label="Descrição" value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} fullWidth multiline rows={2} />
                            <FormControlLabel
                                control={<Switch checked={editForm.data.is_active} onChange={(e) => editForm.setData('is_active', e.target.checked)} color="success" />}
                                label="Ativa"
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditTarget(null)}>Cancelar</Button>
                    <Button form="edit-cat" type="submit" variant="contained" disabled={editForm.processing}>Salvar</Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
