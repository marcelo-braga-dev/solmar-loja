import { Head, useForm, router } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, Select,
    Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Tooltip, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface AdminRow {
    id: number;
    name: string;
    email: string;
    role: string | null;
    is_self: boolean;
    created_at: string;
}

interface Props extends PageProps {
    admins: PaginatedData<AdminRow>;
    filters: { q?: string };
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    finance: 'Financeiro',
    stock: 'Estoque',
    support: 'Atendimento',
};

const ROLE_COLORS: Record<string, 'error' | 'primary' | 'success' | 'warning' | 'info'> = {
    admin: 'error',
    manager: 'primary',
    finance: 'success',
    stock: 'warning',
    support: 'info',
};

export default function AdminsIndex({ admins, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [search, setSearch] = useState(filters.q ?? '');
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'manager',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/admins', { q: search }, { preserveState: true });
    };

    const handleCreate = () => {
        post('/admin/admins', {
            onSuccess: () => { setCreateOpen(false); reset(); },
        });
    };

    const handleRevoke = (admin: AdminRow) => {
        if (confirm(`Remover o acesso de administrador de "${admin.name}"?`)) {
            router.delete(`/admin/admins/${admin.id}`);
        }
    };

    return (
        <AdminLayout title="Administradores" breadcrumbs={[{ label: 'Sistema' }, { label: 'Administradores' }]}>
            <Head title="Administradores — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por nome ou e-mail..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ minWidth: 280 }}
                    />
                    <Button type="submit" variant="outlined">Buscar</Button>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                    Novo Administrador
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Nome</TableCell>
                            <TableCell>E-mail</TableCell>
                            <TableCell>Papel</TableCell>
                            <TableCell>Cadastrado em</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {admins.data.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum administrador cadastrado.</TableCell></TableRow>
                        ) : (
                            admins.data.map((admin) => (
                                <TableRow key={admin.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {admin.name}{admin.is_self && <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}> (você)</Typography>}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{admin.email}</Typography></TableCell>
                                    <TableCell>
                                        {admin.role && (
                                            <Chip label={ROLE_LABELS[admin.role] ?? admin.role} color={ROLE_COLORS[admin.role] ?? 'default'} size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{admin.created_at}</Typography></TableCell>
                                    <TableCell align="center">
                                        <Tooltip title={admin.is_self ? 'Você não pode remover seu próprio acesso' : 'Remover acesso'}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    disabled={admin.is_self}
                                                    onClick={() => handleRevoke(admin)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination pagination={admins} />

            <Dialog open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Administrador</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Alert severity="info">
                            O novo administrador poderá acessar o painel imediatamente com o e-mail e senha cadastrados abaixo.
                        </Alert>
                        <TextField
                            label="Nome *"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="E-mail *"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={!!errors.email}
                            helperText={errors.email}
                            fullWidth
                            size="small"
                        />
                        <FormControl fullWidth size="small" error={!!errors.role}>
                            <InputLabel>Papel *</InputLabel>
                            <Select value={data.role} label="Papel *" onChange={(e) => setData('role', e.target.value)}>
                                <MenuItem value="admin">Administrador (acesso total)</MenuItem>
                                <MenuItem value="manager">Gerente (catálogo, pedidos, estoque)</MenuItem>
                                <MenuItem value="finance">Financeiro (financeiro e relatórios)</MenuItem>
                                <MenuItem value="stock">Estoque</MenuItem>
                                <MenuItem value="support">Atendimento</MenuItem>
                            </Select>
                            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                        </FormControl>
                        <TextField
                            label="Senha *"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={!!errors.password}
                            helperText={errors.password}
                            fullWidth
                            size="small"
                            autoComplete="new-password"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            label="Confirmar senha *"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            error={!!errors.password_confirmation}
                            helperText={errors.password_confirmation}
                            fullWidth
                            size="small"
                            autoComplete="new-password"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); reset(); }}>Cancelar</Button>
                    <Button variant="contained" disabled={processing} onClick={handleCreate}>
                        Cadastrar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
