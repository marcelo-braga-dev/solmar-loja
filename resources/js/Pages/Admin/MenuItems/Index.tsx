import { Head, useForm, router } from '@inertiajs/react';
import {
    Box, Button, Paper, Stack, Typography, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, Select, MenuItem as MuiMenuItem,
    InputLabel, FormControl, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface PageOption {
    key: string;
    label: string;
}

interface MenuItemRow {
    id: number;
    label: string;
    type: 'category' | 'page' | 'custom';
    category_id: number | null;
    page_key: string | null;
    url: string | null;
    position: number;
    is_active: boolean;
    href: string | null;
}

interface Props extends PageProps {
    items: MenuItemRow[];
    categories: Category[];
    pages: PageOption[];
}

interface FormState {
    label: string;
    type: 'category' | 'page' | 'custom';
    category_id: number | '';
    page_key: string;
    url: string;
    position: number;
    is_active: boolean;
}

function emptyForm(nextPosition: number): FormState {
    return { label: '', type: 'category', category_id: '', page_key: '', url: '', position: nextPosition, is_active: true };
}

function TypeFields({ data, setData, categories, pages }: {
    data: FormState;
    setData: (key: keyof FormState, value: unknown) => void;
    categories: Category[];
    pages: PageOption[];
}) {
    if (data.type === 'category') {
        return (
            <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select value={data.category_id} label="Categoria" onChange={(e) => setData('category_id', e.target.value)}>
                    {categories.map((c) => <MuiMenuItem key={c.id} value={c.id}>{c.name}</MuiMenuItem>)}
                </Select>
            </FormControl>
        );
    }

    if (data.type === 'page') {
        return (
            <FormControl fullWidth size="small">
                <InputLabel>Página</InputLabel>
                <Select value={data.page_key} label="Página" onChange={(e) => setData('page_key', e.target.value)}>
                    {pages.map((p) => <MuiMenuItem key={p.key} value={p.key}>{p.label}</MuiMenuItem>)}
                </Select>
            </FormControl>
        );
    }

    return (
        <TextField
            label="URL"
            placeholder="/minha-pagina ou https://..."
            value={data.url}
            onChange={(e) => setData('url', e.target.value)}
            fullWidth
            size="small"
        />
    );
}

export default function MenuItemsIndex({ items, categories, pages }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<MenuItemRow | null>(null);

    const createForm = useForm<FormState>(emptyForm(items.length));
    const editForm = useForm<FormState>(emptyForm(0));

    function openEdit(item: MenuItemRow) {
        editForm.setData({
            label: item.label,
            type: item.type,
            category_id: item.category_id ?? '',
            page_key: item.page_key ?? '',
            url: item.url ?? '',
            position: item.position,
            is_active: item.is_active,
        });
        setEditing(item);
    }

    return (
        <AdminLayout title="Menu Principal" breadcrumbs={[{ label: 'Sistema' }, { label: 'Menu Principal' }]}>
            <Head title="Menu Principal — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Controle os itens exibidos no menu de navegação principal da loja: categorias e páginas (Monte seu Kit, Simulador, Blog).
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { createForm.setData(emptyForm(items.length)); setCreateOpen(true); }}>
                    Novo Item
                </Button>
            </Stack>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{items.length} itens no menu</Typography>
                </Box>
                {items.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>Nenhum item cadastrado.</Box>
                ) : (
                    items.map((item) => (
                        <Box
                            key={item.id}
                            sx={{
                                display: 'flex', alignItems: 'center', px: 2, py: 1.2,
                                borderBottom: '1px solid', borderColor: 'divider',
                                '&:hover': { bgcolor: 'grey.50' },
                            }}
                        >
                            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled', mr: 1 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                                <Chip
                                    label={item.type === 'category' ? 'Categoria' : item.type === 'page' ? 'Página' : 'URL'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: 10 }}
                                />
                                {!item.is_active && <Chip label="Inativo" size="small" color="default" />}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 2, fontFamily: 'monospace' }}>
                                {item.href ?? '—'}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Editar">
                                    <IconButton size="small" onClick={() => openEdit(item)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => confirm('Remover este item do menu?') && router.delete(`/admin/menu-items/${item.id}`)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Box>
                    ))
                )}
            </Paper>

            {/* Create dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Item de Menu</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Palavra exibida no menu *"
                            value={createForm.data.label}
                            onChange={(e) => createForm.setData('label', e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={createForm.data.type}
                                label="Tipo"
                                onChange={(e) => createForm.setData('type', e.target.value as FormState['type'])}
                            >
                                <MuiMenuItem value="category">Categoria</MuiMenuItem>
                                <MuiMenuItem value="page">Página do site</MuiMenuItem>
                                <MuiMenuItem value="custom">URL personalizada</MuiMenuItem>
                            </Select>
                        </FormControl>
                        <TypeFields data={createForm.data} setData={createForm.setData} categories={categories} pages={pages} />
                        <TextField
                            label="Posição"
                            type="number"
                            value={createForm.data.position}
                            onChange={(e) => createForm.setData('position', Number(e.target.value))}
                            fullWidth
                            size="small"
                        />
                        <FormControlLabel
                            control={<Switch checked={createForm.data.is_active} onChange={(e) => createForm.setData('is_active', e.target.checked)} />}
                            label="Ativo"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={createForm.processing}
                        onClick={() => createForm.post('/admin/menu-items', { onSuccess: () => { setCreateOpen(false); createForm.reset(); } })}
                    >
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={editing !== null} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Item de Menu</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Palavra exibida no menu *"
                            value={editForm.data.label}
                            onChange={(e) => editForm.setData('label', e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={editForm.data.type}
                                label="Tipo"
                                onChange={(e) => editForm.setData('type', e.target.value as FormState['type'])}
                            >
                                <MuiMenuItem value="category">Categoria</MuiMenuItem>
                                <MuiMenuItem value="page">Página do site</MuiMenuItem>
                                <MuiMenuItem value="custom">URL personalizada</MuiMenuItem>
                            </Select>
                        </FormControl>
                        <TypeFields data={editForm.data} setData={editForm.setData} categories={categories} pages={pages} />
                        <TextField
                            label="Posição"
                            type="number"
                            value={editForm.data.position}
                            onChange={(e) => editForm.setData('position', Number(e.target.value))}
                            fullWidth
                            size="small"
                        />
                        <FormControlLabel
                            control={<Switch checked={editForm.data.is_active} onChange={(e) => editForm.setData('is_active', e.target.checked)} />}
                            label="Ativo"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditing(null)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={editForm.processing}
                        onClick={() => editing && editForm.put(`/admin/menu-items/${editing.id}`, { onSuccess: () => setEditing(null) })}
                    >
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
