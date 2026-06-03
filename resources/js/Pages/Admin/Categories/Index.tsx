import { Head, useForm, router } from '@inertiajs/react';
import {
    Box, Button, Paper, Stack, Typography, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, Select, MenuItem,
    InputLabel, FormControl, Tooltip, Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';
import type { Category } from '@/Types/catalog';

interface Props extends PageProps {
    categories: Category[];
}

function CategoryRow({ category, depth = 0, allCategories }: { category: Category; depth?: number; allCategories: Category[] }) {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(depth === 0);
    const hasChildren = category.children && category.children.length > 0;

    const { data, setData, put, reset } = useForm({
        name: category.name,
        slug: category.slug,
        parent_id: category.parent_id ?? '',
        is_active: category.is_active ?? true,
        position: category.position ?? 0,
        icon: category.icon ?? '',
    });

    return (
        <>
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', px: 2, py: 1.2,
                    pl: 2 + depth * 3,
                    borderBottom: '1px solid', borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.50' },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                    {hasChildren ? (
                        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                    ) : (
                        <Box sx={{ width: 28 }} />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: depth === 0 ? 700 : 500 }}>
                        {category.name}
                    </Typography>
                    {!category.is_active && <Chip label="Inativo" size="small" color="default" />}
                    {hasChildren && (
                        <Chip label={`${category.children!.length} sub`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                    )}
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', mr: 2, fontFamily: 'monospace' }}>
                    /{category.slug}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => setOpen(true)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirm('Excluir categoria?') && router.delete(`/admin/categories/${category.id}`)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            {hasChildren && expanded && (
                <Collapse in={expanded}>
                    {category.children!.map((child) => (
                        <CategoryRow key={child.id} category={child} depth={depth + 1} allCategories={allCategories} />
                    ))}
                </Collapse>
            )}

            {/* Edit dialog */}
            <Dialog open={open} onClose={() => { setOpen(false); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Categoria</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Nome" value={data.name} onChange={(e) => setData('name', e.target.value)} fullWidth />
                        <TextField label="Slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} fullWidth />
                        <TextField label="Ícone (Material)" value={data.icon} onChange={(e) => setData('icon', e.target.value)} fullWidth />
                        <FormControl fullWidth size="small">
                            <InputLabel>Categoria Pai</InputLabel>
                            <Select value={data.parent_id} label="Categoria Pai" onChange={(e) => setData('parent_id', e.target.value)}>
                                <MenuItem value="">Nenhuma (raiz)</MenuItem>
                                {allCategories.filter(c => c.id !== category.id).map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Posição"
                            type="number"
                            value={data.position}
                            onChange={(e) => setData('position', Number(e.target.value))}
                            fullWidth
                            size="small"
                        />
                        <FormControlLabel
                            control={<Switch checked={Boolean(data.is_active)} onChange={(e) => setData('is_active', e.target.checked)} />}
                            label="Ativa"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={() => { put(`/admin/categories/${category.id}`, { onSuccess: () => setOpen(false) }); }}
                    >
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default function CategoriesIndex({ categories }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const allFlat = categories.flatMap(c => [c, ...(c.children ?? [])]);

    const { data, setData, post, reset, processing } = useForm({
        name: '',
        slug: '',
        parent_id: '',
        is_active: true,
        position: 0,
        icon: '',
    });

    return (
        <AdminLayout title="Categorias" breadcrumbs={[{ label: 'Catálogo' }, { label: 'Categorias' }]}>
            <Head title="Categorias — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                    Nova Categoria
                </Button>
            </Stack>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {categories.length} categorias de nível raiz
                    </Typography>
                </Box>
                {categories.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                        Nenhuma categoria cadastrada.
                    </Box>
                ) : (
                    categories.map((cat) => (
                        <CategoryRow key={cat.id} category={cat} allCategories={allFlat} />
                    ))
                )}
            </Paper>

            {/* Create dialog */}
            <Dialog open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Nome *" value={data.name} onChange={(e) => setData('name', e.target.value)} fullWidth autoFocus />
                        <TextField label="Slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} helperText="Deixe vazio para gerar automaticamente" fullWidth />
                        <TextField label="Ícone (Material Icons)" value={data.icon} onChange={(e) => setData('icon', e.target.value)} fullWidth />
                        <FormControl fullWidth size="small">
                            <InputLabel>Categoria Pai</InputLabel>
                            <Select value={data.parent_id} label="Categoria Pai" onChange={(e) => setData('parent_id', e.target.value)}>
                                <MenuItem value="">Nenhuma (raiz)</MenuItem>
                                {allFlat.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControlLabel control={<Switch checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />} label="Ativa" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); reset(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={processing} onClick={() => post('/admin/categories', { onSuccess: () => { setCreateOpen(false); reset(); } })}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
