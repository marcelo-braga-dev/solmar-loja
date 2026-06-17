import { Head, router } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack,
    Chip, Drawer, Button, Divider, FormGroup,
    FormControlLabel, Checkbox, Slider, FormControl,
    InputLabel, Select, MenuItem, useMediaQuery, useTheme,
    IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useCallback } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import Pagination from '@/Components/storefront/Pagination';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData, Product, Brand } from '@/Types/catalog';

interface SearchFilters {
    q?: string;
    on_sale?: boolean;
    in_stock?: boolean;
    brand?: number;
    price_min?: number;
    price_max?: number;
    sort?: string;
}

interface Props extends PageProps {
    q: string;
    on_sale?: boolean;
    in_stock?: boolean;
    brand?: number;
    price_min?: number;
    price_max?: number;
    sort?: string;
    products: PaginatedData<Product>;
    brands: Brand[];
}

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Mais relevantes' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'newest', label: 'Mais recentes' },
];

export default function Search({ q, on_sale, in_stock, brand, price_min, price_max, sort, products, brands }: Props) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [priceRange, setPriceRange] = useState<[number, number]>([
        price_min ?? 0,
        price_max ?? 5000000,
    ]);

    const currentFilters: SearchFilters = { q: q || undefined, on_sale: on_sale || undefined, in_stock: in_stock || undefined, brand, price_min, price_max, sort };

    const applyFilters = useCallback((newFilters: Partial<SearchFilters>) => {
        const merged: Record<string, string | number | boolean | undefined> = { ...currentFilters, ...newFilters };
        // Remove undefined/false values
        Object.keys(merged).forEach((k) => {
            if (merged[k] === undefined || merged[k] === false || merged[k] === '') delete merged[k];
        });
        router.get('/busca', merged as Record<string, string | number | boolean>, { preserveState: true, preserveScroll: true });
    }, [currentFilters]);

    const removeFilter = (key: keyof SearchFilters) => {
        const updated = { ...currentFilters };
        delete updated[key];
        const clean: Record<string, string | number | boolean | undefined> = { ...updated };
        Object.keys(clean).forEach((k) => { if (!clean[k]) delete clean[k]; });
        router.get('/busca', clean as Record<string, string | number | boolean>, { preserveState: true });
    };

    const activeBrand = brands.find((b) => b.id === brand);
    const activeFilterCount = [on_sale, in_stock, brand, price_min, price_max].filter(Boolean).length;

    const pageTitle = on_sale ? 'Ofertas Especiais' : (q ? `Busca: ${q}` : 'Todos os produtos');
    const heading = on_sale ? '🔥 Ofertas Especiais' : (q ? `Resultados para "${q}"` : 'Todos os produtos');

    const FilterPanel = () => (
        <Box sx={{ width: { xs: 300, md: 'auto' } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Filtros</Typography>

            {/* Marcas */}
            {brands.length > 0 && (
                <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Marcas</Typography>
                    <FormGroup sx={{ mb: 3 }}>
                        {brands.slice(0, 10).map((b) => (
                            <FormControlLabel
                                key={b.id}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={brand === b.id}
                                        onChange={(e) => applyFilters({ brand: e.target.checked ? b.id : undefined })}
                                    />
                                }
                                label={<Typography variant="body2">{b.name}</Typography>}
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }}
                            />
                        ))}
                    </FormGroup>
                </>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Faixa de preço */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Faixa de Preço</Typography>
            <Box sx={{ px: 1.5, mb: 3 }}>
                <Slider
                    value={priceRange}
                    onChange={(_, v) => setPriceRange(v as [number, number])}
                    onChangeCommitted={(_, v) => {
                        const [min, max] = v as [number, number];
                        applyFilters({ price_min: min > 0 ? min : undefined, price_max: max < 5000000 ? max : undefined });
                    }}
                    min={0}
                    max={5000000}
                    step={10000}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => formatBRL(v)}
                />
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatBRL(priceRange[0])}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatBRL(priceRange[1])}</Typography>
                </Stack>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Disponibilidade */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Disponibilidade</Typography>
            <FormGroup sx={{ mb: 2 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={!!in_stock}
                            onChange={(e) => applyFilters({ in_stock: e.target.checked || undefined })}
                        />
                    }
                    label={<Typography variant="body2">Em estoque</Typography>}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={!!on_sale}
                            onChange={(e) => applyFilters({ on_sale: e.target.checked || undefined })}
                        />
                    }
                    label={<Typography variant="body2">Em promoção</Typography>}
                />
            </FormGroup>
        </Box>
    );

    return (
        <StorefrontLayout>
            <Head title={pageTitle} />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{heading}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {products.total} produto{products.total !== 1 ? 's' : ''} encontrado{products.total !== 1 ? 's' : ''}
                    </Typography>
                </Box>

                {/* Active filter chips */}
                {(activeFilterCount > 0 || sort) && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {on_sale && <Chip label="Em promoção" size="small" onDelete={() => removeFilter('on_sale')} color="error" />}
                        {in_stock && <Chip label="Em estoque" size="small" onDelete={() => removeFilter('in_stock')} color="success" />}
                        {activeBrand && <Chip label={activeBrand.name} size="small" onDelete={() => removeFilter('brand')} />}
                        {price_min && <Chip label={`A partir de ${formatBRL(price_min)}`} size="small" onDelete={() => removeFilter('price_min')} />}
                        {price_max && <Chip label={`Até ${formatBRL(price_max)}`} size="small" onDelete={() => removeFilter('price_max')} />}
                    </Stack>
                )}

                <Grid container spacing={3}>
                    {/* Sidebar desktop */}
                    {!isMobile && (
                        <Grid size={{ md: 3 }}>
                            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 80 }}>
                                <FilterPanel />
                            </Paper>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, md: 9 }}>
                        {/* Toolbar */}
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Stack direction="row" spacing={1}>
                                {isMobile && (
                                    <Button
                                        startIcon={<FilterListIcon />}
                                        onClick={() => setDrawerOpen(true)}
                                        variant="outlined"
                                        size="small"
                                        endIcon={activeFilterCount > 0 ? <Chip label={activeFilterCount} size="small" color="primary" sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 10 } }} /> : undefined}
                                    >
                                        Filtros
                                    </Button>
                                )}
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Ordenar</InputLabel>
                                    <Select
                                        value={sort ?? 'relevance'}
                                        label="Ordenar"
                                        onChange={(e) => applyFilters({ sort: e.target.value === 'relevance' ? undefined : e.target.value })}
                                    >
                                        {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <Stack direction="row">
                                    <IconButton size="small" onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'}><GridViewIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}><ViewListIcon fontSize="small" /></IconButton>
                                </Stack>
                            </Stack>
                        </Stack>

                        {products.data.length === 0 ? (
                            <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                                    {q ? `Nenhum resultado para "${q}"` : 'Nenhum produto encontrado'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    Tente termos diferentes ou remova alguns filtros.
                                </Typography>
                                {activeFilterCount > 0 && (
                                    <Button variant="outlined" onClick={() => router.get('/busca', q ? { q } : {})}>
                                        Limpar filtros
                                    </Button>
                                )}
                            </Paper>
                        ) : viewMode === 'list' ? (
                            <Stack spacing={2}>
                                {products.data.map((product) => (
                                    <Paper
                                        key={product.id}
                                        elevation={0}
                                        component="a"
                                        href={`/produtos/${product.slug}`}
                                        sx={{ display: 'flex', gap: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textDecoration: 'none', color: 'inherit', '&:hover': { borderColor: 'primary.main', boxShadow: 1 } }}
                                    >
                                        <Box sx={{ width: 80, height: 80, flexShrink: 0, borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100' }}>
                                            {product.cover_image && <img src={product.cover_image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{product.name}</Typography>
                                            {product.brand_name && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{product.brand_name}</Typography>}
                                        </Box>
                                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                            {product.compare_at_price_cents && (
                                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', display: 'block' }}>
                                                    {formatBRL(product.compare_at_price_cents)}
                                                </Typography>
                                            )}
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                {formatBRL(product.price_cents)}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                ))}
                                <Pagination pagination={products} />
                            </Stack>
                        ) : (
                            <>
                                <Grid container spacing={2}>
                                    {products.data.map((product) => (
                                        <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                            <ProductCard product={product} />
                                        </Grid>
                                    ))}
                                </Grid>
                                <Pagination pagination={products} />
                            </>
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* Mobile filter drawer */}
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ p: 3, width: 300 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Filtros</Typography>
                        <Button size="small" onClick={() => setDrawerOpen(false)}>Fechar</Button>
                    </Stack>
                    <FilterPanel />
                </Box>
            </Drawer>
        </StorefrontLayout>
    );
}

