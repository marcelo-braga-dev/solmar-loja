import { Link, router, usePage } from '@inertiajs/react';
import {
    Card, CardActionArea, CardContent, CardMedia, Typography,
    Chip, Box, Skeleton, IconButton, Tooltip, alpha,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useState } from 'react';
import { formatBRL, formatInstallment } from '@/Lib/formatters';
import { useComparison } from '@/Hooks/useComparison';
import type { Product } from '@/Types/catalog';
import type { SharedProps } from '@/Types/inertia';

interface Props {
    product: Product;
    loading?: boolean;
    isFavorite?: boolean;
}

export default function ProductCard({ product, loading = false, isFavorite = false }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const { toggle: toggleCompare, isInComparison, canAdd } = useComparison();
    const inComparison = isInComparison(product.id);
    const [favorite, setFavorite] = useState(isFavorite);
    const [addingCart, setAddingCart] = useState(false);
    const [addedCart, setAddedCart] = useState(false);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!auth.user) { router.visit('/login'); return; }
        setFavorite(!favorite);
        router.post('/conta/favoritos/toggle', { product_id: product.id }, { preserveScroll: true });
    };

    const addToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAddingCart(true);
        router.post('/carrinho/items', { product_id: product.id, quantity: 1 }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setAddedCart(true);
                setTimeout(() => setAddedCart(false), 2000);
            },
            onFinish: () => setAddingCart(false),
        });
    };

    if (loading) {
        return (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
                <Skeleton variant="rectangular" height={220} />
                <CardContent>
                    <Skeleton variant="text" height={16} width="45%" sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} width="80%" />
                    <Skeleton variant="text" height={28} width="55%" sx={{ mt: 1 }} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
                overflow: 'hidden',
                '&:hover': {
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                    transform: 'translateY(-3px)',
                    '& .card-actions-overlay': { opacity: 1 },
                    '& .card-img': { transform: 'scale(1.04)' },
                },
            }}
        >
            {/* Badges */}
            <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {product.has_discount && product.discount_percent > 0 && (
                    <Chip
                        label={`-${product.discount_percent}%`}
                        size="small"
                        sx={{
                            fontWeight: 800, fontSize: 11,
                            bgcolor: '#DC2626', color: 'white',
                            height: 22, borderRadius: 1,
                        }}
                    />
                )}
                {product.featured && (
                    <Chip
                        label="⭐ Destaque"
                        size="small"
                        sx={{
                            fontWeight: 700, fontSize: 11,
                            bgcolor: '#FFB300', color: '#1A1A1A',
                            height: 22, borderRadius: 1,
                        }}
                    />
                )}
            </Box>

            {/* Botão favorito */}
            <Tooltip title={favorite ? 'Remover dos favoritos' : 'Favoritar'}>
                <IconButton
                    size="small"
                    onClick={toggleFavorite}
                    sx={{
                        position: 'absolute', top: 8, right: 8, zIndex: 2,
                        bgcolor: 'rgba(255,255,255,0.92)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        width: 32, height: 32,
                        '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' },
                        transition: 'all 0.15s',
                    }}
                >
                    {favorite
                        ? <FavoriteIcon sx={{ fontSize: 16, color: '#DC2626' }} />
                        : <FavoriteBorderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                </IconButton>
            </Tooltip>

            {/* Imagem */}
            <CardActionArea component={Link} href={`/produtos/${product.slug}`} sx={{ flexGrow: 1 }}>
                <Box sx={{ overflow: 'hidden', position: 'relative', bgcolor: '#F8F9FA', height: 220 }}>
                    <Box
                        className="card-img"
                        component="img"
                        src={product.cover_image || '/images/placeholder.png'}
                        alt={product.name}
                        loading="lazy"
                        sx={{
                            width: '100%', height: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.4s ease',
                        }}
                    />
                    {/* Overlay "Ver produto" on hover */}
                    <Box
                        className="card-actions-overlay"
                        sx={{
                            position: 'absolute', inset: 0,
                            bgcolor: 'rgba(11,63,145,0.07)',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            pb: 2,
                            opacity: 0,
                            transition: 'opacity 0.22s',
                        }}
                    >
                        <Box sx={{
                            bgcolor: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: 5, px: 2.5, py: 0.8,
                            fontSize: 13, fontWeight: 600, color: 'primary.main',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        }}>
                            Ver produto →
                        </Box>
                    </Box>
                </Box>

                <CardContent sx={{ pb: 1 }}>
                    {product.brand_name && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'primary.main', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: 0.8,
                                fontSize: 10,
                            }}
                        >
                            {product.brand_name}
                        </Typography>
                    )}

                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600, mt: 0.5, fontSize: 14,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: 40,
                            lineHeight: 1.4,
                            color: 'text.primary',
                        }}
                    >
                        {product.name}
                    </Typography>

                    <Box sx={{ mt: 1.5 }}>
                        {product.compare_at_price_cents && product.has_discount && (
                            <Typography
                                variant="caption"
                                sx={{ color: 'text.disabled', textDecoration: 'line-through', display: 'block', fontSize: 12 }}
                            >
                                De: {formatBRL(product.compare_at_price_cents)}
                            </Typography>
                        )}
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 900, lineHeight: 1.1, fontSize: 20,
                                color: product.has_discount ? '#DC2626' : 'primary.main',
                            }}
                        >
                            {formatBRL(product.price_cents)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                            {formatInstallment(product.price_cents)} sem juros
                        </Typography>
                    </Box>
                </CardContent>
            </CardActionArea>

            {/* Botão carrinho + comparar */}
            <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
                <Box
                    component="button"
                    onClick={addToCart}
                    disabled={addingCart || addedCart}
                    sx={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.7,
                        py: 1,
                        border: 'none',
                        borderRadius: 2,
                        cursor: addingCart ? 'wait' : 'pointer',
                        fontSize: 13, fontWeight: 700,
                        transition: 'all 0.18s',
                        ...(addedCart ? {
                            bgcolor: '#16A34A',
                            color: 'white',
                        } : {
                            bgcolor: alpha('#0B5FFF', 0.08),
                            color: 'primary.main',
                            '&:hover': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(11,95,255,0.3)',
                                transform: 'translateY(-1px)',
                            },
                        }),
                        '&:disabled': { opacity: 0.7, cursor: 'not-allowed', transform: 'none' },
                    }}
                >
                    {addedCart
                        ? <><CheckIcon sx={{ fontSize: 16 }} /> Adicionado!</>
                        : <><ShoppingCartIcon sx={{ fontSize: 16 }} /> {addingCart ? 'Adicionando...' : 'Adicionar ao carrinho'}</>}
                </Box>

                {/* Botão comparar */}
                <Tooltip title={inComparison ? 'Remover da comparação' : (!canAdd ? 'Máximo de 4 produtos' : 'Adicionar à comparação')}>
                    <Box
                        component="button"
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            toggleCompare({
                                id: product.id,
                                name: product.name,
                                slug: product.slug,
                                price_cents: product.price_cents,
                                cover_image: product.cover_image ?? null,
                                brand_name: product.brand_name ?? null,
                            });
                        }}
                        disabled={!inComparison && !canAdd}
                        sx={{
                            width: '100%', mt: 0.8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                            py: 0.7, border: 'none',
                            borderRadius: 2, cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                            bgcolor: inComparison ? alpha('#7C3AED', 0.1) : 'transparent',
                            color: inComparison ? '#7C3AED' : 'text.disabled',
                            transition: 'all 0.15s',
                            '&:hover:not(:disabled)': { bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED' },
                            '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
                        }}
                    >
                        <CompareArrowsIcon sx={{ fontSize: 14 }} />
                        {inComparison ? 'Na comparação ✓' : 'Comparar'}
                    </Box>
                </Tooltip>
            </Box>
        </Card>
    );
}
