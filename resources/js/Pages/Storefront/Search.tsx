import { Head } from '@inertiajs/react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData, Product } from '@/Types/catalog';

interface Props extends PageProps {
    q: string;
    products: PaginatedData<Product>;
}

export default function Search({ q, products }: Props) {
    return (
        <StorefrontLayout>
            <Head title={q ? `Busca: ${q}` : 'Busca'} />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {q ? `Resultados para "${q}"` : 'Todos os produtos'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {products.total} produto{products.total !== 1 ? 's' : ''} encontrado{products.total !== 1 ? 's' : ''}
                    </Typography>
                </Box>

                {products.data.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                            Nenhum resultado para "{q}"
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Tente termos diferentes ou mais genéricos.
                        </Typography>
                    </Paper>
                ) : (
                    <>
                        <Grid container spacing={3}>
                            {products.data.map((product) => (
                                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <ProductCard product={product} />
                                </Grid>
                            ))}
                        </Grid>
                        <Pagination pagination={products} />
                    </>
                )}
            </Container>
        </StorefrontLayout>
    );
}
