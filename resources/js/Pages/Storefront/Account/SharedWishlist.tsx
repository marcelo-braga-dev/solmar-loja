import { Head } from '@inertiajs/react';
import { Box, Container, Typography, Grid, Paper, Stack } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import type { PageProps } from '@inertiajs/react';
import type { Product } from '@/Types/catalog';

interface Props extends PageProps {
    owner_name: string;
    favorites: Product[];
}

export default function SharedWishlist({ owner_name, favorites }: Props) {
    return (
        <StorefrontLayout>
            <Head title={`Lista de Favoritos de ${owner_name}`} />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 4 }}>
                    <FavoriteIcon sx={{ color: 'error.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            Lista de favoritos de {owner_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {favorites.length} produto{favorites.length !== 1 ? 's' : ''} na lista
                        </Typography>
                    </Box>
                </Stack>

                {favorites.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                            Esta lista está vazia.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {favorites.map((product) => (
                            <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                <ProductCard product={product} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </StorefrontLayout>
    );
}
