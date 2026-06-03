import { Link } from '@inertiajs/react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { formatBRL } from '@/Lib/formatters';
import { getRecentlyViewed, type RecentProduct } from '@/Hooks/useRecentlyViewed';

interface Props {
    excludeId?: number;
}

export default function RecentlyViewed({ excludeId }: Props) {
    const [products, setProducts] = useState<RecentProduct[]>([]);

    useEffect(() => {
        const viewed = getRecentlyViewed().filter((p) => p.id !== excludeId);
        setProducts(viewed.slice(0, 4));
    }, [excludeId]);

    if (products.length === 0) return null;

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Vistos recentemente</Typography>
            <Grid container spacing={2}>
                {products.map((product) => (
                    <Grid key={product.id} size={{ xs: 6, sm: 3 }}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <CardActionArea component={Link} href={`/produtos/${product.slug}`}>
                                <CardMedia
                                    component="img"
                                    height={100}
                                    image={product.cover_image || '/images/placeholder.png'}
                                    alt={product.name}
                                    sx={{ objectFit: 'contain', bgcolor: '#f9f9f9', p: 1 }}
                                />
                                <CardContent sx={{ p: 1.5 }}>
                                    {product.brand_name && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: 10 }}>
                                            {product.brand_name}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3, mb: 0.5 }} noWrap>
                                        {product.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                        {formatBRL(product.price_cents)}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
