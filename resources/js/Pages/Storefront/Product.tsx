import { Head, router, usePage } from '@inertiajs/react';
import {
    Box, Container, Grid, Typography, Button, Chip, Divider,
    Paper, Stack, Tab, Tabs, Avatar, IconButton, Snackbar, Alert,
    TextField, Modal, Fade, Backdrop,
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
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { useState, useEffect, useCallback, useRef } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import Breadcrumb from '@/Components/storefront/Breadcrumb';
import ProductCard from '@/Components/storefront/ProductCard';
import { formatBRL, formatInstallment } from '@/Lib/formatters';
import { useTrackView } from '@/Hooks/useRecentlyViewed';
import type { SharedProps } from '@/Types/inertia';
import type { PageProps } from '@inertiajs/react';
import type { Product, ProductImage } from '@/Types/catalog';

interface Props extends PageProps {
    product: Product;
    relatedProducts: Product[];
}

export default function ProductPage({ product, relatedProducts }: Props) {
    const { auth, branding } = usePage<SharedProps>().props;
    const freeShippingMin = branding?.free_shipping_min_cents ?? 200000;
    const freeShippingEnabled = branding?.free_shipping_enabled ?? true;
    const [activeImage, setActiveImage]   = useState(0);
    const [activeTab, setActiveTab]       = useState(0);
    const [quantity, setQuantity]         = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [addingCart, setAddingCart]     = useState(false);
    const [isFavorite, setIsFavorite]     = useState(false);
    const [snackbar, setSnackbar]         = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    // Galeria — Lightbox e Zoom
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
    const zoomRef = useRef<HTMLDivElement>(null);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const lightboxPrev = useCallback(() => {
        setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
    }, []);

    const lightboxNext = useCallback(() => {
        setLightboxIndex(prev => (prev + 1) % images.length);
    }, []);

    useEffect(() => {
        if (!lightboxOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape')      setLightboxOpen(false);
            if (e.key === 'ArrowLeft')   lightboxPrev();
            if (e.key === 'ArrowRight')  lightboxNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxOpen, lightboxPrev, lightboxNext]);

    const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!zoomRef.current) return;
        const rect = zoomRef.current.getBoundingClientRect();
        setZoomPos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

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
    const currentImage = images[activeImage];

    return (
        <StorefrontLayout>
            <Head title={`${product.meta_title ?? product.name} — SolarHub Commerce`} />

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {product.breadcrumbs && (
                    <Breadcrumb crumbs={product.breadcrumbs as { name: string; slug?: string }[]} />
                )}

                <Grid container spacing={4}>
                    {/* Galeria */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box>
                            {/* Imagem principal com zoom */}
                            <Box
                                ref={zoomRef}
                                onClick={() => currentImage && openLightbox(activeImage)}
                                onMouseMove={handleZoomMove}
                                onMouseLeave={() => setZoomPos(null)}
                                sx={{
                                    position: 'relative',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    mb: 2,
                                    aspectRatio: '1/1',
                                    bgcolor: '#F8F9FA',
                                    cursor: 'zoom-in',
                                    userSelect: 'none',
                                }}
                            >
                                {currentImage ? (
                                    <Box
                                        component="img"
                                        src={currentImage.url}
                                        alt={currentImage.alt ?? product.name}
                                        sx={{
                                            position: 'absolute', inset: 0,
                                            width: '100%', height: '100%',
                                            objectFit: 'contain',
                                            padding: '16px',
                                            transition: 'transform 0.15s ease',
                                            transform: zoomPos ? 'scale(2.2)' : 'scale(1)',
                                            transformOrigin: zoomPos
                                                ? `${zoomPos.x}% ${zoomPos.y}%`
                                                : '50% 50%',
                                            willChange: 'transform',
                                        }}
                                    />
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sem imagem</Typography>
                                    </Box>
                                )}

                                {/* Badge "clique para ampliar" */}
                                {!zoomPos && currentImage && (
                                    <Box sx={{
                                        position: 'absolute', bottom: 10, right: 10,
                                        display: 'flex', alignItems: 'center', gap: 0.5,
                                        bgcolor: 'rgba(0,0,0,0.45)', color: 'white',
                                        borderRadius: 5, px: 1.2, py: 0.4,
                                        fontSize: 11, fontWeight: 500,
                                        backdropFilter: 'blur(4px)',
                                        pointerEvents: 'none',
                                    }}>
                                        <ZoomInIcon sx={{ fontSize: 14 }} />
                                        Ampliar
                                    </Box>
                                )}

                                {/* Setas de navegação */}
                                {images.length > 1 && (
                                    <>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i - 1 + images.length) % images.length); }}
                                            sx={{
                                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                                bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 2,
                                                '&:hover': { bgcolor: 'white', transform: 'translateY(-50%) scale(1.1)' },
                                                transition: 'all 0.15s',
                                                opacity: zoomPos ? 0 : 1,
                                            }}
                                        >
                                            <ChevronLeftIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i + 1) % images.length); }}
                                            sx={{
                                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                                bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 2,
                                                '&:hover': { bgcolor: 'white', transform: 'translateY(-50%) scale(1.1)' },
                                                transition: 'all 0.15s',
                                                opacity: zoomPos ? 0 : 1,
                                            }}
                                        >
                                            <ChevronRightIcon fontSize="small" />
                                        </IconButton>
                                    </>
                                )}
                            </Box>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {images.map((img, i) => (
                                        <Box
                                            key={i}
                                            onClick={() => setActiveImage(i)}
                                            sx={{
                                                width: 68, height: 68,
                                                border: '2px solid',
                                                borderColor: i === activeImage ? 'primary.main' : 'transparent',
                                                borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                                                bgcolor: '#F8F9FA',
                                                outline: i === activeImage ? 'none' : '1px solid',
                                                outlineColor: 'divider',
                                                transition: 'all 0.15s',
                                                '&:hover': { borderColor: 'primary.light', transform: 'scale(1.05)' },
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={img.url}
                                                alt={img.alt ?? ''}
                                                sx={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                            />
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Grid>

                    {/* ── LIGHTBOX ─────────────────────────────────── */}
                    <Modal
                        open={lightboxOpen}
                        onClose={() => setLightboxOpen(false)}
                        closeAfterTransition
                        slots={{ backdrop: Backdrop }}
                        slotProps={{ backdrop: { timeout: 300, sx: { bgcolor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' } } }}
                        sx={{ zIndex: 1500 }}
                    >
                        <Fade in={lightboxOpen} timeout={250}>
                            <Box sx={{
                                position: 'fixed', inset: 0,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                outline: 'none',
                            }}>
                                {/* Topo: contador + fechar */}
                                <Box sx={{
                                    position: 'fixed', top: 0, left: 0, right: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    px: 3, py: 2,
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                                    zIndex: 1,
                                }}>
                                    <Typography sx={{ color: 'white', fontSize: 14, fontWeight: 500, opacity: 0.8 }}>
                                        {lightboxIndex + 1} / {images.length}
                                    </Typography>
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                                        <Typography sx={{ color: 'white', fontSize: 14, fontWeight: 600, opacity: 0.9 }} noWrap>
                                            {product.name}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        onClick={() => setLightboxOpen(false)}
                                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>

                                {/* Imagem central */}
                                <Box
                                    sx={{
                                        flex: 1, width: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        px: { xs: 6, md: 12 }, py: 8,
                                        position: 'relative',
                                    }}
                                    onClick={() => setLightboxOpen(false)}
                                >
                                    <Box
                                        component="img"
                                        src={images[lightboxIndex]?.url}
                                        alt={images[lightboxIndex]?.alt ?? product.name}
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{
                                            maxWidth: '100%', maxHeight: '80vh',
                                            objectFit: 'contain',
                                            borderRadius: 2,
                                            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                                            transition: 'opacity 0.2s ease',
                                            userSelect: 'none',
                                        }}
                                    />

                                    {/* Seta esquerda */}
                                    {images.length > 1 && (
                                        <IconButton
                                            onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                                            sx={{
                                                position: 'absolute', left: { xs: 8, md: 24 }, top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'white',
                                                bgcolor: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                backdropFilter: 'blur(8px)',
                                                width: 48, height: 48,
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'translateY(-50%) scale(1.08)' },
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <ChevronLeftIcon sx={{ fontSize: 28 }} />
                                        </IconButton>
                                    )}

                                    {/* Seta direita */}
                                    {images.length > 1 && (
                                        <IconButton
                                            onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                                            sx={{
                                                position: 'absolute', right: { xs: 8, md: 24 }, top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'white',
                                                bgcolor: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                backdropFilter: 'blur(8px)',
                                                width: 48, height: 48,
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'translateY(-50%) scale(1.08)' },
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <ChevronRightIcon sx={{ fontSize: 28 }} />
                                        </IconButton>
                                    )}
                                </Box>

                                {/* Thumbnails do lightbox */}
                                {images.length > 1 && (
                                    <Box sx={{
                                        position: 'fixed', bottom: 0, left: 0, right: 0,
                                        display: 'flex', justifyContent: 'center', gap: 1.5,
                                        px: 3, py: 2,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
                                        flexWrap: 'wrap',
                                    }}>
                                        {images.map((img, i) => (
                                            <Box
                                                key={i}
                                                onClick={() => setLightboxIndex(i)}
                                                sx={{
                                                    width: 56, height: 56,
                                                    borderRadius: 1.5,
                                                    overflow: 'hidden',
                                                    border: '2px solid',
                                                    borderColor: i === lightboxIndex ? 'white' : 'rgba(255,255,255,0.2)',
                                                    opacity: i === lightboxIndex ? 1 : 0.55,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    '&:hover': { opacity: 1, borderColor: 'rgba(255,255,255,0.7)' },
                                                    bgcolor: '#111',
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={img.url}
                                                    alt=""
                                                    sx={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Fade>
                    </Modal>

                    {/* Info do produto */}
                    <Grid size={{ xs: 12, md: 7 }}>
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
