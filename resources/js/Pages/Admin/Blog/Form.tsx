import { Head, Link, useForm } from '@inertiajs/react';
import {
    Alert, Box, Button, Card, CardContent, FormControl, Grid,
    InputLabel, MenuItem, Select, Stack, Switch, FormControlLabel,
    TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';

interface Category { id: number; name: string }
interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    status: string;
    post_category_id: number | null;
    meta_title: string | null;
    meta_description: string | null;
    cover_image: string | null;
}

interface Props extends PageProps {
    categories: Category[];
    post: Post | null;
}

export default function BlogForm({ categories, post }: Props) {
    const isEdit = !!post;

    const { data, setData, post: submit, put, processing, errors } = useForm({
        title:            post?.title            ?? '',
        slug:             post?.slug             ?? '',
        post_category_id: post?.post_category_id ?? '',
        excerpt:          post?.excerpt          ?? '',
        content:          post?.content          ?? '',
        status:           post?.status           ?? 'draft',
        meta_title:       post?.meta_title       ?? '',
        meta_description: post?.meta_description ?? '',
        cover_image:      null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/posts/${post.id}`, { forceFormData: true });
        } else {
            submit('/admin/posts', { forceFormData: true });
        }
    };

    return (
        <AdminLayout>
            <Head title={isEdit ? `Editar: ${post.title}` : 'Novo post — Admin'} />

            <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 4 }}>
                <Button component={Link} href="/admin/posts" startIcon={<ArrowBackIcon />} variant="outlined" size="small">
                    Voltar
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {isEdit ? 'Editar post' : 'Novo post'}
                </Typography>
            </Stack>

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3}>
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Conteúdo</Typography>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Título"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            error={!!errors.title}
                                            helperText={errors.title}
                                            fullWidth
                                            required
                                        />
                                        <TextField
                                            label="Slug (URL)"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            error={!!errors.slug}
                                            helperText={errors.slug || 'Deixe vazio para gerar automaticamente'}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Resumo"
                                            value={data.excerpt}
                                            onChange={(e) => setData('excerpt', e.target.value)}
                                            error={!!errors.excerpt}
                                            helperText={errors.excerpt}
                                            multiline
                                            rows={2}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Conteúdo (HTML ou Markdown)"
                                            value={data.content}
                                            onChange={(e) => setData('content', e.target.value)}
                                            error={!!errors.content}
                                            helperText={errors.content}
                                            multiline
                                            rows={16}
                                            fullWidth
                                            required
                                            inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>SEO</Typography>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Meta título"
                                            value={data.meta_title}
                                            onChange={(e) => setData('meta_title', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Meta descrição"
                                            value={data.meta_description}
                                            onChange={(e) => setData('meta_description', e.target.value)}
                                            multiline
                                            rows={2}
                                            fullWidth
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3}>
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Publicação</Typography>
                                    <Stack spacing={2}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={data.status === 'published'}
                                                    onChange={(e) => setData('status', e.target.checked ? 'published' : 'draft')}
                                                    color="success"
                                                />
                                            }
                                            label={data.status === 'published' ? 'Publicado' : 'Rascunho'}
                                        />

                                        <FormControl fullWidth size="small">
                                            <InputLabel>Categoria</InputLabel>
                                            <Select
                                                value={data.post_category_id}
                                                onChange={(e) => setData('post_category_id', e.target.value)}
                                                label="Categoria"
                                            >
                                                <MenuItem value="">Sem categoria</MenuItem>
                                                {categories.map((c) => (
                                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Imagem de capa</Typography>
                                    {post?.cover_image && (
                                        <Box
                                            component="img"
                                            src={`/storage/${post.cover_image}`}
                                            sx={{ width: '100%', borderRadius: 1, mb: 2, objectFit: 'cover', maxHeight: 160 }}
                                        />
                                    )}
                                    <Button variant="outlined" component="label" fullWidth size="small">
                                        {post?.cover_image ? 'Trocar imagem' : 'Selecionar imagem'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={(e) => setData('cover_image', e.target.files?.[0] ?? null)}
                                        />
                                    </Button>
                                    {errors.cover_image && <Alert severity="error" sx={{ mt: 1 }}>{errors.cover_image}</Alert>}
                                </CardContent>
                            </Card>

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={processing}
                                sx={{ fontWeight: 700 }}
                            >
                                {processing ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar post'}
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </AdminLayout>
    );
}
