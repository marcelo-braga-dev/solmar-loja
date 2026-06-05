import { Head, router, usePage } from '@inertiajs/react';
import {
    Box, Container, Grid, Typography, Button, Chip, Divider,
    Paper, Stack, Tab, Tabs, Avatar, IconButton, Snackbar, Alert,
    TextField,
} from '@mui/material';
import ReviewSection from '@/Components/storefront/ReviewSection';
import RecentlyViewed from '@/Components/storefront/RecentlyViewed';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useState, useEffect, useRef } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductGallery from '@/Components/storefront/ProductGallery';
import FlashSaleBanner from '@/Components/storefront/FlashSaleBanner';
import FrequentlyBought from '@/Components/storefront/FrequentlyBought';
import QuoteModal from '@/Components/storefront/QuoteModal';
import SocialProof from '@/Components/storefront/SocialProof';
import ShippingCalculator from '@/Components/storefront/ShippingCalculator';
import Breadcrumb from '@/Components/storefront/Breadcrumb';
import ProductCard from '@/Components/storefront/ProductCard';
import { formatBRL, formatInstallment } from '@/Lib/formatters';
import { useTrackView } from '@/Hooks/useRecentlyViewed';
import type { SharedProps } from '@/Types/inertia';
import type { PageProps } from '@inertiajs/react';
import type { Product, ProductImage } from '@/Types/catalog';

interface FBProduct { id: number; name: string; slug: string; price_cents: number; has_discount: boolean; brand_name: string | null; cover_image: string | null }

interface Props extends PageProps {
    product: Product;
    relatedProducts: Product[];
    frequentlyBought: FBProduct[];
}

export default function ProductPage({ product, relatedProducts, frequentlyBought }: Props) {
    const { auth, branding } = usePage<SharedProps>().props;
    const freeShippingMin = branding?.free_shipping_min_cents ?? 200000;
    const freeShippingEnabled = branding?.free_shipping_enabled ?? true;

    // Sticky bar visibility (aparece ao rolar além de 400px)
    const [showStickyBar, setShowStickyBar] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowStickyBar(window.scrollY > 420);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Alerta de estoque
    const [alertEmail, setAlertEmail]   = useState('');
    const [alertSending, setAlertSending] = useState(false);
    const [alertDone, setAlertDone]     = useState(false);

    const sendStockAlert = async () => {
        if (!alertEmail) return;
        setAlertSending(true);
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        try {
            const res = await fetch(`/produtos/${product.id}/alertas`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: alertEmail }),
            });
            if (res.ok) setAlertDone(true);
        } finally {
            setAlertSending(false);
        }
    };

    const [activeTab, setActiveTab]       = useState(0);
    const [quantity, setQuantity]         = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [addingCart, setAddingCart]     = useState(false);
    const [isFavorite, setIsFavorite]     = useState(false);
    const [quoteOpen, setQuoteOpen]       = useState(false);
    const [snackbar, setSnackbar]         = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });


    const handleAddToCart = () => {
        setAddingCart(true);
        router.post('/carrinho/items', {
            product_id: product.id,
            quantity,
            variant_id: selectedVariant,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setSnackbar({ open: true, message: 'Produto adicionado ao carrinho!', severity: 'success' }),
            onError:   () => setSnackbar({ open: true, message: 'Erro ao adicionar ao carrinho.', severity: 'error' }),
            onFinish:  () => setAddingCart(false),
        });
    };

    const handleFavorite = () => {
        if (!auth.user) {
            router.visit('/login');
            return;
        }
        setIsFavorite(!isFavorite);
        router.post('/conta/favoritos/toggle', { product_id: product.id }, { preserveScroll: true });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: product.name, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            setSnackbar({ open: true, message: 'Link copiado!', severity: 'success' });
        }
    };

    useTrackView({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price_cents: product.price_cents,
        cover_image: product.cover_image ?? null,
        brand_name: product.brand_name ?? null,
    });

    const images: ProductImage[] = product.images ?? [];
    const currentImage = images[0];

    return (
        <StorefrontLayout>
            <Head title={`${product.meta_title ?? product.name} — SolarHub Commerce`} />

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {product.breadcrumbs && (
                    <Breadcrumb crumbs={product.breadcrumbs as { name: string; slug?: string }[]} />
                )}

                <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
                    {/* ── GALERIA ─── sticky no desktop ─────────────── */}
                    <Grid size={{ xs: 12, md: 6 }} sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
                        <ProductGallery
                            images={images}
                            productName={product.name}
                            hasDiscount={product.has_discount}
                            discountPercent={product.discount_percent}
                        />
                    </Grid>

                    {/* Info do produto */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={2.5}>
                            {product.brand && (
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {product.brand.name}
                                </Typography>
                            )}

                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                {product.name}
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>SKU: {product.sku}</Typography>
                                {product.has_discount && (
                                    <Chip label={`-${product.discount_percent}%`} color="error" size="small" sx={{ fontWeight: 700 }} />
                                )}
                            </Stack>

                            {/* Flash Sale Banner */}
                            <FlashSaleBanner productId={product.id} />

                            <Box>
                                {product.compare_at_price_cents && product.has_discount && (
                                    <Typography variant="body1" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                                        De: {formatBRL(product.compare_at_price_cents)}
                                    </Typography>
                                )}
                                <Typography variant="h3" color="primary" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                                    {formatBRL(product.price_cents)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    ou {formatInstallment(product.price_cents)} sem juros
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600, mt: 0.5 }}>
                                    {formatBRL(Math.round(product.price_cents * 0.95))} no Pix (5% off)
                                </Typography>
                            </Box>

                            {product.short_description && (
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    {product.short_description}
                                </Typography>
                            )}

                            {/* Social Proof */}
                            <SocialProof productId={product.id} />

                            {/* Seleção de variante */}
                            {product.variants && product.variants.length > 0 && (
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Variante:</Typography>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                        {product.variants.map((v: any) => (
                                            <Chip
                                                key={v.id}
                                                label={v.name}
                                                clickable
                                                variant={selectedVariant === v.id ? 'filled' : 'outlined'}
                                                color={selectedVariant === v.id ? 'primary' : 'default'}
                                                onClick={() => setSelectedVariant(v.id)}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Quantidade */}
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Quantidade:</Typography>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: 'fit-content' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        sx={{ border: '1px solid', borderColor: 'divider' }}
                                    >
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <TextField
                                        value={quantity}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value);
                                            if (!isNaN(v) && v >= 1) setQuantity(v);
                                        }}
                                        size="small"
                                        inputProps={{ min: 1, style: { textAlign: 'center', width: 48 } }}
                                        sx={{ '& fieldset': { borderColor: 'divider' } }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => setQuantity(q => q + 1)}
                                        sx={{ border: '1px solid', borderColor: 'divider' }}
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Box>

                            {/* Ações */}
                            <Stack spacing={1.5}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<ShoppingCartIcon />}
                                    onClick={handleAddToCart}
                                    disabled={addingCart}
                                    sx={{ py: 1.5, fontWeight: 700, fontSize: '1rem' }}
                                    fullWidth
                                >
                                    {addingCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                                </Button>

                                {/* Botão Solicitar Cotação */}
                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    onClick={() => setQuoteOpen(true)}
                                    sx={{ fontWeight: 600, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.50' } }}
                                >
                                    🧾 Solicitar Cotação (Grandes Volumes)
                                </Button>

                                {/* QuoteModal */}
                                <QuoteModal
                                    open={quoteOpen}
                                    onClose={() => setQuoteOpen(false)}
                                    items={[{ product_id: product.id, qty: quantity }]}
                                    productName={product.name}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        startIcon={isFavorite ? <FavoriteIcon sx={{ color: 'error.main' }} /> : <FavoriteBorderIcon />}
                                        onClick={handleFavorite}
                                        sx={{ flex: 1, color: isFavorite ? 'error.main' : 'inherit', borderColor: isFavorite ? 'error.light' : 'divider' }}
                                    >
                                        {isFavorite ? 'Favoritado' : 'Favoritar'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ShareIcon />}
                                        onClick={handleShare}
                                        sx={{ flex: 1 }}
                                    >
                                        Compartilhar
                                    </Button>
                                </Stack>
                            </Stack>

                            {/* Calculadora de Frete */}
                            <ShippingCalculator
                                weightGrams={product.weight_grams}
                                freeShippingMin={freeShippingMin}
                                productPriceCents={product.price_cents}
                            />

                            {/* Garantias */}
                            <Paper elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 2, p: 2 }}>
                                <Stack spacing={1}>
                                    {[
                                        ...(freeShippingEnabled ? [{ icon: <LocalShippingIcon />, text: `Frete Grátis para todo o Brasil em compras acima de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(freeShippingMin / 100)}` }] : []),
                                        { icon: <VerifiedIcon />, text: 'Produto original com garantia do fabricante' },
                                    ].map((item, i) => (
                                        <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                                                {item.icon}
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.text}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Paper>

                            {/* Categorias */}
                            {product.categories && product.categories.length > 0 && (
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>Categoria:</Typography>
                                    {product.categories.map((cat) => (
                                        <Chip key={cat.id} label={cat.name} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </Grid>
                </Grid>

                {/* Tabs: Descrição e Especificações */}
                <Box sx={{ mt: 6 }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tab label="Descrição" />
                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <Tab label="Especificações Técnicas" />
                        )}
                        <Tab label="Avaliações" />
                    </Tabs>

                    {activeTab === 0 && product.description && (
                        <Box
                            dangerouslySetInnerHTML={{ __html: product.description }}
                            sx={{ '& p': { mb: 2 }, '& ul': { pl: 2 }, maxWidth: 860, color: 'text.primary', lineHeight: 1.8 }}
                        />
                    )}

                    {activeTab === 1 && product.specifications && (
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', maxWidth: 600 }}>
                            {Object.entries(product.specifications).map(([key, value], i) => (
                                <Box
                                    key={key}
                                    sx={{
                                        display: 'flex',
                                        bgcolor: i % 2 === 0 ? 'grey.50' : 'white',
                                        px: 3, py: 1.5,
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 600, width: '40%', color: 'text.secondary' }}>
                                        {key}
                                    </Typography>
                                    <Typography variant="body2">{String(value)}</Typography>
                                </Box>
                            ))}
                        </Paper>
                    )}

                    {/* Avaliações */}
                    {activeTab === (product.specifications && Object.keys(product.specifications).length > 0 ? 2 : 1) && (
                        <ReviewSection productSlug={product.slug} productId={product.id} />
                    )}
                </Box>

                {/* Frequentemente comprados juntos */}
                {frequentlyBought.length > 0 && (
                    <FrequentlyBought
                        mainProduct={{ id: product.id, name: product.name, slug: product.slug, price_cents: product.price_cents, has_discount: product.has_discount, brand_name: product.brand?.name ?? null, cover_image: images[0]?.url ?? null }}
                        companions={frequentlyBought}
                    />
                )}

                {/* Produtos relacionados */}
                {relatedProducts.length > 0 && (
                    <Box sx={{ mt: 8 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Produtos Relacionados</Typography>
                        <Grid container spacing={3}>
                            {relatedProducts.map((p) => (
                                <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <ProductCard product={p} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Vistos recentemente */}
                <Box sx={{ mt: 6 }}>
                    <Divider sx={{ mb: 4 }} />
                    <RecentlyViewed excludeId={product.id} />
                </Box>
            </Container>

            {/* Feedback de ações */}
            {/* ── STICKY ADD TO CART BAR ────────────────────────────── */}
            {showStickyBar && (
                <Box sx={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
                    bgcolor: 'white',
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
                    py: 1.5, px: 2,
                    animation: 'slideUpBar 0.25s ease',
                    '@keyframes slideUpBar': {
                        from: { transform: 'translateY(100%)' },
                        to:   { transform: 'translateY(0)' },
                    },
                }}>
                    <Container maxWidth="lg">
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                            {/* Imagem miniatura */}
                            {images[0]?.url && (
                                <Box
                                    component="img"
                                    src={images[0].url}
                                    sx={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 1, bgcolor: '#F8F9FA', p: 0.5, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}
                                />
                            )}
                            {/* Nome e preço */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }} noWrap>{product.name}</Typography>
                                <Typography sx={{ fontSize: 16, fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>{formatBRL(product.price_cents)}</Typography>
                            </Box>
                            {/* Botão */}
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<ShoppingCartIcon />}
                                onClick={handleAddToCart}
                                disabled={addingCart}
                                sx={{ flexShrink: 0, px: 3, fontWeight: 700 }}
                            >
                                {addingCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                            </Button>
                        </Stack>
                    </Container>
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    sx={{ fontWeight: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </StorefrontLayout>
    );
}
