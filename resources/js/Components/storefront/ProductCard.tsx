import { Link, router, usePage } from '@inertiajs/react';
import {
    Card, CardActionArea, CardContent, CardMedia, Typography,
    Chip, Box, Skeleton, IconButton, Tooltip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useState } from 'react';
import { formatBRL, formatInstallment } from '@/Lib/formatters';
import type { Product } from '@/Types/catalog';
import type { SharedProps } from '@/Types/inertia';

interface Props {
    product: Product;
    loading?: boolean;
    isFavorite?: boolean;
}

export default function ProductCard({ product, loading = false, isFavorite = false }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const [favorite, setFavorite] = useState(isFavorite);
    const [addingCart, setAddingCart] = useState(false);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth.user) {
            router.visit('/login');
            return;
        }

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
            onFinish: () => setAddingCart(false),
        });
    };

    if (loading) {
        return (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                    <Skeleton variant="text" height={24} width="80%" />
                    <Skeleton variant="text" height={20} width="50%" />
                    <Skeleton variant="text" height={28} width="60%" />
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
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 4 },
            }}
        >
            {/* Badge de desconto */}
            {product.has_discount && product.discount_percent > 0 && (
                <Chip
                    label={`-${product.discount_percent}%`}
                    color="error"
                    size="small"
                    sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, fontWeight: 700 }}
                />
            )}

            {/* Botão favorito */}
            <Tooltip title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                <IconButton
                    size="small"
                    onClick={toggleFavorite}
                    sx={{
                        position: 'absolute', top: 6, right: 6, zIndex: 1,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'white' },
                    }}
                >
                    {favorite
                        ? <FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} />
                        : <FavoriteBorderIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                </IconButton>
            </Tooltip>

            <CardActionArea component={Link} href={`/produtos/${product.slug}`} sx={{ flexGrow: 1 }}>
                <CardMedia
                    component="img"
                    height={200}
                    image={product.cover_image || '/images/placeholder.png'}
                    alt={product.name}
                    loading="lazy"
                    sx={{ objectFit: 'contain', bgcolor: '#f9f9f9', p: 1 }}
                />
                <CardContent>
                    {product.brand_name && (
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                        >
                            {product.brand_name}
                        </Typography>
                    )}

                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600, mt: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: 40,
                        }}
                    >
                        {product.name}
                    </Typography>

                    <Box sx={{ mt: 1.5 }}>
                        {product.compare_at_price_cents && product.has_discount && (
                            <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', textDecoration: 'line-through', display: 'block' }}
                            >
                                {formatBRL(product.compare_at_price_cents)}
                            </Typography>
                        )}
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {formatBRL(product.price_cents)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatInstallment(product.price_cents)} sem juros
                        </Typography>
                    </Box>
                </CardContent>
            </CardActionArea>

            {/* Botão adicionar ao carrinho */}
            <Box sx={{ px: 2, pb: 2, pt: 0 }}>
                <Tooltip title="Adicionar ao carrinho">
                    <Box
                        component="button"
                        onClick={addToCart}
                        disabled={addingCart}
                        sx={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 0.5, py: 0.8, border: '1px solid', borderColor: 'primary.main',
                            borderRadius: 1, bgcolor: 'transparent', color: 'primary.main',
                            cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            transition: 'all 0.15s',
                            '&:hover': { bgcolor: 'primary.main', color: 'white' },
                            '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
                        }}
                    >
                        <ShoppingCartIcon sx={{ fontSize: 16 }} />
                        {addingCart ? 'Adicionando...' : 'Adicionar ao carrinho'}
                    </Box>
                </Tooltip>
            </Box>
        </Card>
    );
}
