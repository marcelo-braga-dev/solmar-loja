import { Head, router } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack,
    Slider, FormGroup, FormControlLabel, Checkbox,
    Select, MenuItem, InputLabel, FormControl,
    Chip, Drawer, Button, Divider, Avatar,
    useMediaQuery, useTheme, Tooltip, IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useState, useCallback } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import Breadcrumb from '@/Components/storefront/Breadcrumb';
import Pagination from '@/Components/storefront/Pagination';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { Category, Brand, Product, PaginatedData, ProductFilters, Facet } from '@/Types/catalog';

interface Props extends PageProps {
    category: Category;
    products: PaginatedData<Product>;
    brands: Brand[];
    facets: Facet[];
    filters: ProductFilters;
}

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Mais relevantes' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'newest', label: 'Mais recentes' },
];

export default function CategoryPage({ category, products, brands, facets, filters }: Props) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [viewMode, setViewMode]     = useState<'grid' | 'list'>('grid');

    const [priceRange, setPriceRange] = useState<[number, number]>([
        filters.price_min ?? 0,
        filters.price_max ?? 5000000,
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

    const toggleAttrValue = (valueId: number) => {
        const current = filters.attrs ?? [];
        const updated = current.includes(valueId)
            ? current.filter((id) => id !== valueId)
            : [...current, valueId];
        applyFilters({ attrs: updated.length > 0 ? updated : undefined });
    };

    const removeAttrValue = (valueId: number) => {
        const updated = (filters.attrs ?? []).filter((id) => id !== valueId);
        applyFilters({ attrs: updated.length > 0 ? updated : undefined });
    };

    const selectedCategoryIds = filters.categories ?? [category.id];

    const toggleCategory = (id: number) => {
        const isLastChecked = selectedCategoryIds.length === 1 && selectedCategoryIds.includes(id);
        if (isLastChecked) return; // mantém sempre ao menos uma categoria marcada

        const updated = selectedCategoryIds.includes(id)
            ? selectedCategoryIds.filter((cid) => cid !== id)
            : [...selectedCategoryIds, id];
        applyFilters({ categories: updated });
    };

    const facetValueLabel = (valueId: number): string => {
        for (const facet of facets) {
            const found = facet.values.find((v) => v.id === valueId);
            if (found) return found.value;
        }
        return String(valueId);
    };

    const activeFilterCount = Object.entries(filters)
        .filter(([key, value]) => key !== 'attrs' && key !== 'categories' && Boolean(value)).length
        + (filters.attrs?.length ?? 0)
        + (selectedCategoryIds.length > 1 ? selectedCategoryIds.length : 0);

    const FilterPanel = () => (
        <Box sx={{ width: { xs: 300, md: 'auto' }, p: { xs: 2, md: 0 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Filtros</Typography>

            {/* Subcategorias */}
            {category.children && category.children.length > 0 && (
                <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Subcategorias</Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                        {category.children.map((child) => (
                            <Chip
                                key={child.id}
                                label={child.name}
                                component="a"
                                href={`/categorias/${child.slug}`}
                                clickable
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                    <Divider sx={{ mb: 3 }} />
                </>
            )}

            {/* Categorias irmãs (inclui a categoria atual) — seleção múltipla */}
            {category.siblings && category.siblings.length > 1 && (
                <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Categorias relacionadas</Typography>
                    <FormGroup sx={{ mb: 3 }}>
                        {category.siblings.map((sibling) => (
                            <FormControlLabel
                                key={sibling.id}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={selectedCategoryIds.includes(sibling.id)}
                                        onChange={() => toggleCategory(sibling.id)}
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ fontWeight: sibling.id === category.id ? 700 : 400 }}>
                                        {sibling.name}{sibling.id === category.id ? ' (atual)' : ''}
                                    </Typography>
                                }
                            />
                        ))}
                    </FormGroup>
                    <Divider sx={{ mb: 3 }} />
                </>
            )}

            {/* Atributos dinâmicos por categoria */}
            {facets.map((facet) => (
                <Box key={facet.id}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{facet.name}</Typography>
                    <FormGroup sx={{ mb: 3 }}>
                        {facet.values.map((fv) => (
                            <FormControlLabel
                                key={fv.id}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={(filters.attrs ?? []).includes(fv.id)}
                                        onChange={() => toggleAttrValue(fv.id)}
                                    />
                                }
                                label={<Typography variant="body2">{fv.value} <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>({fv.count})</Typography></Typography>}
                            />
                        ))}
                    </FormGroup>
                </Box>
            ))}
            {facets.length > 0 && <Divider sx={{ mb: 3 }} />}

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
                max={5000000}
                step={10000}
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

            {/* Disponibilidade */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Disponibilidade</Typography>
            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={!!filters.in_stock}
                            onChange={(e) => applyFilters({ in_stock: e.target.checked || undefined })}
                        />
                    }
                    label={<Typography variant="body2">Em estoque</Typography>}
                />
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
                            <Paper
                                elevation={0}
                                sx={{ border: '1px solid', borderColor: 'divider', p: 3, borderRadius: 2 }}
                            >
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
                                {filters.in_stock && (
                                    <Chip label="Em estoque" onDelete={() => removeFilter('in_stock')} size="small" color="success" variant="outlined" />
                                )}
                                {filters.on_sale && (
                                    <Chip label="Em promoção" onDelete={() => removeFilter('on_sale')} size="small" color="error" variant="outlined" />
                                )}
                                {(filters.attrs ?? []).map((valueId) => (
                                    <Chip
                                        key={valueId}
                                        label={facetValueLabel(valueId)}
                                        onDelete={() => removeAttrValue(valueId)}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
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
                                {/* Toggle Grid/Lista */}
                                <Stack direction="row" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                                    <Tooltip title="Grade">
                                        <IconButton
                                            size="small"
                                            onClick={() => setViewMode('grid')}
                                            sx={{ borderRadius: 0, bgcolor: viewMode === 'grid' ? 'primary.main' : 'transparent', color: viewMode === 'grid' ? 'white' : 'text.secondary', '&:hover': { bgcolor: viewMode === 'grid' ? 'primary.main' : 'grey.100' } }}
                                        >
                                            <GridViewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Lista">
                                        <IconButton
                                            size="small"
                                            onClick={() => setViewMode('list')}
                                            sx={{ borderRadius: 0, bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent', color: viewMode === 'list' ? 'white' : 'text.secondary', '&:hover': { bgcolor: viewMode === 'list' ? 'primary.main' : 'grey.100' } }}
                                        >
                                            <ViewListIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Stack>

                        {/* Produtos */}
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
                        ) : viewMode === 'grid' ? (
                            <Grid container spacing={3}>
                                {products.data.map((product) => (
                                    <Grid key={product.id} size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                                        <ProductCard product={product} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            /* Modo lista */
                            <Stack spacing={1.5}>
                                {products.data.map((product) => (
                                    <Paper
                                        key={product.id}
                                        elevation={0}
                                        component="a"
                                        href={`/produtos/${product.slug}`}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 2, p: 2,
                                            border: '1px solid rgba(0,0,0,0.07)', borderRadius: 2.5,
                                            textDecoration: 'none', color: 'inherit',
                                            transition: 'all 0.15s',
                                            '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(11,95,255,0.1)' },
                                        }}
                                    >
                                        <Avatar
                                            src={product.cover_image ?? undefined}
                                            variant="rounded"
                                            sx={{ width: 80, height: 80, bgcolor: '#F8F9FA', flexShrink: 0, '& img': { objectFit: 'contain' } }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            {product.brand_name && (
                                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    {product.brand_name}
                                                </Typography>
                                            )}
                                            <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.3 }} noWrap>{product.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>SKU: {product.sku}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                            {product.compare_at_price_cents && product.has_discount && (
                                                <Typography variant="caption" sx={{ color: 'text.disabled', textDecoration: 'line-through', display: 'block' }}>
                                                    {formatBRL(product.compare_at_price_cents)}
                                                </Typography>
                                            )}
                                            <Typography sx={{ fontWeight: 900, fontSize: 18, color: product.has_discount ? '#DC2626' : 'primary.main', lineHeight: 1.1 }}>
                                                {formatBRL(product.price_cents)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                                                12x sem juros
                                            </Typography>
                                            {product.has_discount && (
                                                <Chip label={`-${product.discount_percent}%`} size="small" color="error" sx={{ mt: 0.5, fontWeight: 700, fontSize: 10, height: 18, display: 'block' }} />
                                            )}
                                        </Box>
                                        <Box sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<AddShoppingCartIcon />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.post('/carrinho/items', { product_id: product.id, quantity: 1 }, { preserveScroll: true });
                                                }}
                                                sx={{ fontWeight: 700 }}
                                            >
                                                Comprar
                                            </Button>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
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
