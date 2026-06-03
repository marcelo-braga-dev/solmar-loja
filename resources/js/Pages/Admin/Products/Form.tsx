import { Head, useForm, router } from '@inertiajs/react';
import {
    Box, Button, Grid, Paper, Stack, TextField, Typography,
    FormControlLabel, Switch, Select, MenuItem, InputLabel,
    FormControl, Autocomplete, InputAdornment,
    Alert, IconButton, Chip, Tooltip, CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { type ElementType, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';
import type { Product, Category, Brand } from '@/Types/catalog';

interface Props extends PageProps {
    product?: Product;
    categories: Category[];
    brands: Brand[];
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'published', label: 'Publicado' },
    { value: 'archived', label: 'Arquivado' },
];

export default function ProductForm({ product, categories, brands }: Props) {
    const isEdit   = !!product;
    const fileRef  = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !product?.uuid) return;

        setUploading(true);
        setUploadError(null);

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append('image', file);
            try {
                const res = await fetch(`/admin/products/${product.uuid}/images`, {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
                    body: fd,
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    setUploadError(err.message ?? 'Erro ao enviar imagem.');
                }
            } catch {
                setUploadError('Erro de conexão ao enviar imagem.');
            }
        }

        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
        router.reload({ only: ['product'] });
    };

    const handleDeleteImage = (productUuid: string, imageId: number) => {
        if (!confirm('Remover esta imagem?')) return;
        router.delete(`/admin/products/${productUuid}/images/${imageId}`);
    };

    const { data, setData, post, put, processing, errors } = useForm({
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        sku: product?.sku ?? '',
        price_cents: product?.price_cents ?? 0,
        compare_at_price_cents: product?.compare_at_price_cents ?? '',
        cost_cents: product?.cost_cents ?? '',
        status: product?.status ?? 'draft',
        brand_id: product?.brand_id ?? '',
        category_ids: product?.category_ids ?? [],
        short_description: product?.short_description ?? '',
        description: product?.description ?? '',
        weight_grams: product?.weight_grams ?? '',
        featured: product?.featured ?? false,
        meta_title: product?.meta_title ?? '',
        meta_description: product?.meta_description ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && product) {
            put(`/admin/products/${product.uuid}`);
        } else {
            post('/admin/products');
        }
    };

    const selectedCategories = categories.filter((c) => (data.category_ids as number[]).includes(c.id));
    const selectedBrand = brands.find((b) => b.id === Number(data.brand_id)) ?? null;

    return (
        <AdminLayout
            title={isEdit ? `Editar: ${product.name}` : 'Novo Produto'}
            breadcrumbs={[{ label: 'Catálogo' }, { label: 'Produtos', href: '/admin/products' }, { label: isEdit ? 'Editar' : 'Novo' }]}
        >
            <Head title={`${isEdit ? 'Editar' : 'Novo'} Produto — Admin`} />

            <Box component="form" onSubmit={handleSubmit}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Button component={Link as ElementType} href="/admin/products" startIcon={<ArrowBackIcon />} variant="outlined">
                        Voltar
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={processing} size="large">
                        {processing ? 'Salvando...' : 'Salvar Produto'}
                    </Button>
                </Stack>

                <Grid container spacing={3}>
                    {/* Main */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={3}>
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Informações Básicas</Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Nome do Produto *"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={!!errors.name}
                                        helperText={errors.name}
                                        fullWidth
                                    />
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 8 }}>
                                            <TextField
                                                label="Slug (URL)"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value)}
                                                error={!!errors.slug}
                                                helperText={errors.slug ?? 'Deixe vazio para gerar automaticamente'}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField
                                                label="SKU *"
                                                value={data.sku}
                                                onChange={(e) => setData('sku', e.target.value)}
                                                error={!!errors.sku}
                                                helperText={errors.sku}
                                                fullWidth
                                            />
                                        </Grid>
                                    </Grid>
                                    <TextField
                                        label="Descrição Curta"
                                        value={data.short_description}
                                        onChange={(e) => setData('short_description', e.target.value)}
                                        error={!!errors.short_description}
                                        helperText={errors.short_description}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />
                                    <TextField
                                        label="Descrição Completa"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={6}
                                        placeholder="HTML permitido..."
                                    />
                                </Stack>
                            </Paper>

                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Preços</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Preço de Venda *"
                                            type="number"
                                            inputProps={{ step: '0.01', min: '0' }}
                                            value={data.price_cents ? (data.price_cents / 100).toFixed(2) : ''}
                                            onChange={(e) => setData('price_cents', Math.round(Number(e.target.value) * 100))}
                                            error={!!errors.price_cents}
                                            helperText={errors.price_cents}
                                            fullWidth
                                            slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Preço 'De' (original)"
                                            type="number"
                                            inputProps={{ step: '0.01', min: '0' }}
                                            value={data.compare_at_price_cents ? (Number(data.compare_at_price_cents) / 100).toFixed(2) : ''}
                                            onChange={(e) => setData('compare_at_price_cents', Math.round(Number(e.target.value) * 100))}
                                            helperText="Para mostrar desconto"
                                            fullWidth
                                            slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Custo"
                                            type="number"
                                            inputProps={{ step: '0.01', min: '0' }}
                                            value={data.cost_cents ? (Number(data.cost_cents) / 100).toFixed(2) : ''}
                                            onChange={(e) => setData('cost_cents', Math.round(Number(e.target.value) * 100))}
                                            helperText="Apenas interno"
                                            fullWidth
                                            slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Dimensões e Peso</Typography>
                                <Grid container spacing={2}>
                                    {[
                                        { label: 'Peso (g)', key: 'weight_grams' },
                                    ].map(({ label, key }) => (
                                        <Grid key={key} size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                label={label}
                                                type="number"
                                                value={(data as Record<string, unknown>)[key] as string}
                                                onChange={(e) => setData(key as keyof typeof data, e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>

                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>SEO</Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Meta Title"
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        fullWidth
                                        helperText="Deixe vazio para usar o nome do produto"
                                    />
                                    <TextField
                                        label="Meta Description"
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        helperText="Máx 500 caracteres"
                                    />
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Sidebar */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3}>
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Status e Visibilidade</Typography>
                                <Stack spacing={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={data.status}
                                            label="Status"
                                            onChange={(e) => setData('status', e.target.value)}
                                        >
                                            {STATUS_OPTIONS.map((o) => (
                                                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={Boolean(data.featured)}
                                                onChange={(e) => setData('featured', e.target.checked)}
                                            />
                                        }
                                        label="Produto em destaque"
                                    />
                                </Stack>
                            </Paper>

                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Organização</Typography>
                                <Stack spacing={2}>
                                    <Autocomplete
                                        options={brands}
                                        getOptionLabel={(o) => o.name}
                                        value={selectedBrand}
                                        onChange={(_, v) => setData('brand_id', v?.id ?? '')}
                                        renderInput={(params) => <TextField {...params} label="Marca" size="small" />}
                                    />
                                    <Autocomplete<Category, true>
                                        multiple
                                        options={categories}
                                        getOptionLabel={(o) => o.name}
                                        value={selectedCategories}
                                        onChange={(_, v) => setData('category_ids', v.map((c) => c.id))}
                                        renderInput={(params) => <TextField {...params} label="Categorias" size="small" />}
                                    />
                                </Stack>
                            </Paper>

                            {isEdit && (
                                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Imagens</Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={uploading ? <CircularProgress size={14} /> : <CloudUploadIcon />}
                                            onClick={() => fileRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Enviando...' : 'Enviar imagens'}
                                        </Button>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={handleFileChange}
                                        />
                                    </Stack>

                                    {uploadError && (
                                        <Alert severity="error" sx={{ mb: 2, fontSize: 13 }} onClose={() => setUploadError(null)}>
                                            {uploadError}
                                        </Alert>
                                    )}

                                    {product?.images && product.images.length > 0 ? (
                                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                                            {product.images.map((img) => (
                                                <Box
                                                    key={img.id}
                                                    sx={{
                                                        position: 'relative',
                                                        width: 96, height: 96,
                                                        borderRadius: 2,
                                                        border: '2px solid',
                                                        borderColor: img.is_cover ? 'primary.main' : 'divider',
                                                        overflow: 'hidden',
                                                        '&:hover .img-actions': { opacity: 1 },
                                                    }}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={img.url}
                                                        alt={img.alt ?? ''}
                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    />
                                                    {img.is_cover && (
                                                        <Chip
                                                            label="Capa"
                                                            size="small"
                                                            color="primary"
                                                            sx={{ position: 'absolute', top: 4, left: 4, height: 18, fontSize: 10, fontWeight: 700 }}
                                                        />
                                                    )}
                                                    <Box
                                                        className="img-actions"
                                                        sx={{
                                                            position: 'absolute', inset: 0,
                                                            bgcolor: 'rgba(0,0,0,0.45)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                                                            opacity: 0, transition: 'opacity 0.15s',
                                                        }}
                                                    >
                                                        <Tooltip title="Remover">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteImage(product.uuid!, img.id)}
                                                                sx={{ bgcolor: 'rgba(220,38,38,0.9)', color: 'white', '&:hover': { bgcolor: 'error.main' }, p: 0.5 }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Box
                                            onClick={() => fileRef.current?.click()}
                                            sx={{
                                                border: '2px dashed', borderColor: 'divider', borderRadius: 2,
                                                p: 4, textAlign: 'center', cursor: 'pointer',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Clique para selecionar imagens ou arraste aqui
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                                JPG, PNG, WEBP · Máx. 5MB por arquivo
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </AdminLayout>
    );
}
