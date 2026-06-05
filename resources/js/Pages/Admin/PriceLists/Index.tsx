import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Box, Button, Chip, Divider, Grid, IconButton, Paper, Stack,
    Table, TableBody, TableCell, TableHead, TableRow, TextField,
    Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel,
    Tooltip, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';

interface PriceListRow {
    id: number;
    name: string;
    code: string;
    description: string | null;
    type: string;
    type_label: string;
    discount_percent: number;
    is_default: boolean;
    is_active: boolean;
    is_public: boolean;
    product_prices_count: number;
    valid_from: string | null;
    valid_until: string | null;
}

interface Props extends PageProps { lists: PriceListRow[] }

const TYPE_COLORS: Record<string, string> = {
    retail: '#0B5FFF', consultant: '#7C3AED', wholesale: '#059669', special: '#EA580C',
};

export default function PriceListsIndex({ lists }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editList, setEditList]     = useState<PriceListRow | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name:             '',
        code:             '',
        description:      '',
        type:             'retail',
        discount_percent: 0,
        is_active:        true,
        is_public:        true,
        valid_from:       '',
        valid_until:      '',
    });

    const openEdit = (list: PriceListRow) => {
        setEditList(list);
        setData({
            name: list.name, code: list.code, description: list.description ?? '',
            type: list.type, discount_percent: list.discount_percent,
            is_active: list.is_active, is_public: list.is_public,
            valid_from: '', valid_until: '',
        });
    };

    const handleCreate = () => post('/admin/price-lists', { onSuccess: () => { setCreateOpen(false); reset(); } });
    const handleUpdate = () => editList && put(`/admin/price-lists/${editList.id}`, { onSuccess: () => { setEditList(null); reset(); } });

    const FormFields = (
        <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
                <TextField label="Nome *" value={data.name} onChange={e => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} fullWidth size="small" />
                {!editList && <TextField label="Código *" value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())} error={!!errors.code} helperText={errors.code ?? 'Ex.: CONSULTOR'} fullWidth size="small" />}
            </Stack>
            <TextField label="Descrição" value={data.description} onChange={e => setData('description', e.target.value)} fullWidth size="small" multiline rows={2} />
            <Stack direction="row" spacing={2}>
                <FormControl fullWidth size="small">
                    <InputLabel>Tipo *</InputLabel>
                    <Select value={data.type} label="Tipo *" onChange={e => setData('type', e.target.value)}>
                        <MenuItem value="retail">Preço Público</MenuItem>
                        <MenuItem value="consultant">Consultor</MenuItem>
                        <MenuItem value="wholesale">Atacado / Integrador</MenuItem>
                        <MenuItem value="special">Especial</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Desconto % sobre preço público" type="number" inputProps={{ min: 0, max: 100 }} value={data.discount_percent} onChange={e => setData('discount_percent', Number(e.target.value))} fullWidth size="small" helperText="0% = preço integral" />
            </Stack>
            <Stack direction="row" spacing={2}>
                <TextField label="Válida a partir de" type="date" value={data.valid_from} onChange={e => setData('valid_from', e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Válida até" type="date" value={data.valid_until} onChange={e => setData('valid_until', e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <Stack direction="row" spacing={3}>
                <FormControlLabel control={<Switch checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />} label="Ativa" />
                <FormControlLabel control={<Switch checked={data.is_public} onChange={e => setData('is_public', e.target.checked)} />} label="Visível na loja" />
            </Stack>
        </Stack>
    );

    return (
        <AdminLayout title="Tabelas de Preço" breadcrumbs={[{ label: 'Catálogo' }, { label: 'Tabelas de Preço' }]}>
            <Head title="Tabelas de Preço — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Tabelas de Preço</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Gerencie os preços por segmento: público, consultores, integradores e distribuidores
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { reset(); setCreateOpen(true); }}>
                    Nova Tabela
                </Button>
            </Stack>

            {/* Cards de tabelas */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {lists.map(list => (
                    <Grid key={list.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
                            {/* Barra colorida no topo */}
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: TYPE_COLORS[list.type] ?? '#6B7280', borderRadius: '12px 12px 0 0' }} />

                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5, mb: 2 }}>
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(TYPE_COLORS[list.type] ?? '#6B7280', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LocalOfferIcon sx={{ color: TYPE_COLORS[list.type], fontSize: 22 }} />
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                    {list.is_default && <Chip label="Padrão" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
                                    {!list.is_active && <Chip label="Inativa" size="small" color="default" sx={{ fontSize: 10, height: 18 }} />}
                                </Stack>
                            </Stack>

                            <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{list.name}</Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: TYPE_COLORS[list.type], fontWeight: 700, mb: 0.5 }}>{list.code}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>{list.description || list.type_label}</Typography>

                            <Box sx={{ bgcolor: alpha(TYPE_COLORS[list.type] ?? '#6B7280', 0.06), borderRadius: 2, p: 1.5, mb: 2 }}>
                                <Typography sx={{ fontSize: 28, fontWeight: 900, color: TYPE_COLORS[list.type], lineHeight: 1 }}>
                                    {list.discount_percent > 0 ? `-${list.discount_percent}%` : 'Cheio'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {list.discount_percent > 0 ? 'sobre o preço público' : 'sem desconto por tabela'}
                                </Typography>
                            </Box>

                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                                {list.product_prices_count} preços customizados
                            </Typography>

                            <Stack direction="row" spacing={1}>
                                <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(list)} fullWidth disabled={list.is_default} sx={{ fontSize: 12 }}>
                                    Editar
                                </Button>
                                {!list.is_default && (
                                    <Tooltip title="Excluir tabela">
                                        <IconButton size="small" color="error" onClick={() => confirm(`Excluir tabela "${list.name}"?`) && router.delete(`/admin/price-lists/${list.id}`)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Tabela completa */}
            <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)', bgcolor: '#FAFAFA' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Resumo das Tabelas</Typography>
                </Box>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                            {['Código', 'Nome', 'Tipo', 'Desconto', 'Preços Custom.', 'Status', ''].map(h => (
                                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lists.map(list => (
                            <TableRow key={list.id} hover>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: TYPE_COLORS[list.type] }}>{list.code}</TableCell>
                                <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{list.name}</Typography></TableCell>
                                <TableCell><Chip label={list.type_label} size="small" sx={{ bgcolor: alpha(TYPE_COLORS[list.type] ?? '#6B7280', 0.1), color: TYPE_COLORS[list.type], fontWeight: 600, fontSize: 11 }} /></TableCell>
                                <TableCell><Typography variant="body2" sx={{ fontWeight: 700, color: list.discount_percent > 0 ? 'success.main' : 'text.secondary' }}>{list.discount_percent > 0 ? `-${list.discount_percent}%` : '—'}</Typography></TableCell>
                                <TableCell align="center">{list.product_prices_count}</TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={0.5}>
                                        {list.is_active ? <Chip label="Ativa" size="small" color="success" sx={{ fontSize: 10, height: 18 }} /> : <Chip label="Inativa" size="small" sx={{ fontSize: 10, height: 18 }} />}
                                        {list.is_default && <Chip label="Padrão" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">
                                    <Button size="small" onClick={() => openEdit(list)} disabled={list.is_default} startIcon={<EditIcon />}>Editar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Dialog criar */}
            <Dialog open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Nova Tabela de Preço</DialogTitle>
                <DialogContent>{FormFields}</DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); reset(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={processing} onClick={handleCreate}>Criar Tabela</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog editar */}
            <Dialog open={!!editList} onClose={() => { setEditList(null); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Editar: {editList?.name}</DialogTitle>
                <DialogContent>{FormFields}</DialogContent>
                <DialogActions>
                    <Button onClick={() => { setEditList(null); reset(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={processing} onClick={handleUpdate}>Salvar</Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
