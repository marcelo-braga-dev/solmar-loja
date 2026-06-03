import { Head, router } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack,
    Slider, FormGroup, FormControlLabel, Checkbox,
    Select, MenuItem, InputLabel, FormControl,
    Chip, Drawer, Button, Divider,
    useMediaQuery, useTheme,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useState, useCallback } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import Breadcrumb from '@/Components/storefront/Breadcrumb';
import Pagination from '@/Components/storefront/Pagination';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { Category, Brand, Product, PaginatedData, ProductFilters } from '@/Types/catalog';

interface Props extends PageProps {
    category: Category;
    products: PaginatedData<Product>;
    brands: Brand[];
    filters: ProductFilters;
}

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Mais relevantes' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'newest', label: 'Mais recentes' },
];

export default function CategoryPage({ category, products, brands, filters }: Props) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [priceRange, setPriceRange] = useState<[number, number]>([
        filters.price_min ?? 0,
        filters.price_max ?? 500000,
    ]);

    const applyFilters = useCallback((newFilters: Partial<ProductFilters>) => {
        router.get(
            `/categorias/${category.slug}`,
            { ...filters, ...newFilters },
            { preserveState: true, preserveScroll: true },
        );
    }, [category.slug, filters]);

    const removeFilter = (key: keyof ProductFilters) => {
        const updated = { ...filters };
        delete updated[key];
        router.get(`/categorias/${category.slug}`, updated, { preserveState: true });
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const FilterPanel = () => (
        <Box sx={{ width: { xs: 300, md: 'auto' }, p: { xs: 2, md: 0 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Filtros</Typography>

            {/* Marcas */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Marcas</Typography>
            <FormGroup sx={{ mb: 3 }}>
                {brands.slice(0, 8).map((brand) => (
                    <FormControlLabel
                        key={brand.id}
                        control={
                            <Checkbox
                                size="small"
                                checked={filters.brand === brand.id}
                                onChange={(e) => applyFilters({ brand: e.target.checked ? brand.id : undefined })}
                            />
                        }
                        label={<Typography variant="body2">{brand.name}</Typography>}
                    />
                ))}
            </FormGroup>

            <Divider sx={{ mb: 3 }} />

            {/* Faixa de preço */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Faixa de Preço</Typography>
            <Slider
                value={priceRange}
                min={0}
                max={500000}
                step={1000}
                onChange={(_, val) => setPriceRange(val as [number, number])}
                onChangeCommitted={(_, val) => {
                    const [min, max] = val as [number, number];
                    applyFilters({ price_min: min, price_max: max });
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => formatBRL(v)}
                sx={{ mb: 1 }}
            />
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="caption">{formatBRL(priceRange[0])}</Typography>
                <Typography variant="caption">{formatBRL(priceRange[1])}</Typography>
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Outros filtros */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Disponibilidade</Typography>
            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={!!filters.on_sale}
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
            <Head title={`${category.name} — SolarHub Commerce`} />

            <Container maxWidth="lg">
                {category.breadcrumbs && <Breadcrumb crumbs={category.breadcrumbs as { name: string; slug?: string }[]} />}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>{category.name}</Typography>
                    {category.description && (
                        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>{category.description}</Typography>
                    )}
                </Box>

                <Grid container spacing={3}>
                    {/* Filtros — desktop */}
                    {!isMobile && (
                        <Grid size={{ md: 3 }}>
                            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3, borderRadius: 2, position: 'sticky', top: 80 }}>
                                <FilterPanel />
                            </Paper>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, md: 9 }}>
                        {/* Toolbar */}
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {products.total} produto{products.total !== 1 ? 's' : ''}
                                </Typography>
                                {filters.brand && (
                                    <Chip
                                        label={`Marca: ${brands.find(b => b.id === filters.brand)?.name}`}
                                        onDelete={() => removeFilter('brand')}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}
                                {filters.on_sale && (
                                    <Chip label="Em promoção" onDelete={() => removeFilter('on_sale')} size="small" color="error" variant="outlined" />
                                )}
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                {isMobile && (
                                    <Button
                                        startIcon={<FilterListIcon />}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setDrawerOpen(true)}
                                    >
                                        Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
                                    </Button>
                                )}
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Ordenar por</InputLabel>
                                    <Select
                                        value={filters.sort ?? 'relevance'}
                                        label="Ordenar por"
                                        onChange={(e) => applyFilters({ sort: e.target.value })}
                                    >
                                        {SORT_OPTIONS.map((o) => (
                                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Stack>

                        {/* Grid de produtos */}
                        {products.data.length === 0 ? (
                            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Nenhum produto encontrado</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                    Tente remover alguns filtros para ver mais resultados.
                                </Typography>
                                <Button variant="outlined" onClick={() => router.get(`/categorias/${category.slug}`)}>
                                    Limpar filtros
                                </Button>
                            </Paper>
                        ) : (
                            <Grid container spacing={3}>
                                {products.data.map((product) => (
                                    <Grid key={product.id} size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                                        <ProductCard product={product} />
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        <Pagination pagination={products} />
                    </Grid>
                </Grid>
            </Container>

            {/* Mobile filter drawer */}
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <FilterPanel />
            </Drawer>
        </StorefrontLayout>
    );
}
