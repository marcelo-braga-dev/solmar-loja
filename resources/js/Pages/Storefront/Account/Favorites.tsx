import { Head } from '@inertiajs/react';
import { Grid, Typography, Paper } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccountLayout from '@/Layouts/AccountLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import type { PageProps } from '@inertiajs/react';
import type { Product } from '@/Types/catalog';

interface Props extends PageProps { favorites: Product[] }

export default function Favorites({ favorites }: Props) {
    return (
        <AccountLayout title="Meus Favoritos">
            <Head title="Favoritos" />
            {favorites.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <FavoriteBorderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Nenhum favorito ainda</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Salve seus produtos favoritos clicando no ♡ na página do produto.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {favorites.map((product) => (
                        <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <ProductCard product={product} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </AccountLayout>
    );
}
