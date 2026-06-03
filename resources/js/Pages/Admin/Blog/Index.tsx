import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Button, Chip, IconButton, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface PostRow {
    id: number;
    title: string;
    slug: string;
    status: string;
    published_at: string | null;
    created_at: string;
    author: { id: number; name: string };
    category: { id: number; name: string } | null;
}

interface Props extends PageProps {
    posts: PaginatedData<PostRow>;
    filters: Record<string, string>;
}

export default function BlogIndex({ posts, filters }: Props) {
    const handleDelete = (id: number, title: string) => {
        if (confirm(`Excluir o post "${title}"?`)) {
            router.delete(`/admin/posts/${id}`);
        }
    };

    const applyFilter = (key: string, value: string) => {
        router.get('/admin/posts', { ...filters, [key]: value }, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <Head title="Blog — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Blog</Typography>
                <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/admin/posts/create">
                    Novo post
                </Button>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField
                    size="small"
                    placeholder="Buscar título..."
                    defaultValue={filters.q}
                    onBlur={(e) => applyFilter('q', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilter('q', (e.target as HTMLInputElement).value); }}
                    sx={{ width: 260 }}
                />
                {['', 'draft', 'published'].map((s) => (
                    <Chip
                        key={s}
                        label={s === '' ? 'Todos' : s === 'draft' ? 'Rascunhos' : 'Publicados'}
                        color={filters.status === s || (!filters.status && s === '') ? 'primary' : 'default'}
                        onClick={() => applyFilter('status', s)}
                        clickable
                    />
                ))}
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                            <TableCell>Título</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell>Autor</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Publicado em</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {posts.data.map((post) => (
                            <TableRow key={post.id} hover>
                                <TableCell sx={{ maxWidth: 280 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{post.title}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>/blog/{post.slug}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{post.category?.name ?? '—'}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{post.author.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={post.status === 'published' ? 'Publicado' : 'Rascunho'}
                                        color={post.status === 'published' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {post.published_at
                                            ? new Date(post.published_at).toLocaleDateString('pt-BR')
                                            : '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Editar">
                                        <IconButton size="small" component={Link} href={`/admin/posts/${post.id}/edit`}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(post.id, post.title)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {posts.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhum post encontrado.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Box sx={{ p: 2 }}>
                    <Pagination pagination={posts} />
                </Box>
            </TableContainer>
        </AdminLayout>
    );
}
