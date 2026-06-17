import { Head, router, usePage } from '@inertiajs/react';
import { Grid, Typography, Paper, Stack, Button, Box, Chip, Alert, IconButton, Tooltip } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import AccountLayout from '@/Layouts/AccountLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import type { PageProps } from '@inertiajs/react';
import type { Product } from '@/Types/catalog';
import type { SharedProps } from '@/Types/inertia';

interface Props extends PageProps {
    favorites: Product[];
    wishlist_public?: boolean;
    wishlist_token?: string;
}

export default function Favorites({ favorites, wishlist_public, wishlist_token }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const shareUrl = wishlist_token
        ? `${window.location.origin}/wishlist/${wishlist_token}`
        : null;

    const copyLink = () => {
        if (shareUrl) navigator.clipboard.writeText(shareUrl);
    };

    const toggleSharing = () => {
        router.post('/conta/favoritos/compartilhar');
    };

    return (
        <AccountLayout title="Meus Favoritos">
            <Head title="Favoritos" />

            {favorites.length > 0 && (
                <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Compartilhar Lista
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {wishlist_public
                                    ? 'Sua lista está pública. Qualquer pessoa com o link pode ver.'
                                    : 'Compartilhe sua lista de favoritos com amigos e familiares.'}
                            </Typography>
                            {wishlist_public && shareUrl && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                                    <Chip
                                        label={shareUrl}
                                        size="small"
                                        icon={<LinkIcon />}
                                        sx={{ maxWidth: 300, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                                    />
                                    <Tooltip title="Copiar link">
                                        <IconButton size="small" onClick={copyLink}><LinkIcon fontSize="small" /></IconButton>
                                    </Tooltip>
                                </Stack>
                            )}
                        </Box>
                        <Button
                            variant={wishlist_public ? 'outlined' : 'contained'}
                            startIcon={wishlist_public ? <LockIcon /> : <ShareIcon />}
                            onClick={toggleSharing}
                            color={wishlist_public ? 'error' : 'primary'}
                            size="small"
                        >
                            {wishlist_public ? 'Desativar compartilhamento' : 'Compartilhar lista'}
                        </Button>
                    </Stack>
                </Paper>
            )}

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
