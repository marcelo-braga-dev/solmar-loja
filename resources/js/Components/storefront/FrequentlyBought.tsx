import { router } from '@inertiajs/react';
import { Box, Button, Checkbox, Divider, Paper, Stack, Typography, Avatar, alpha, Chip } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useState } from 'react';
import { formatBRL } from '@/Lib/formatters';

interface FBProduct {
    id: number;
    name: string;
    slug: string;
    price_cents: number;
    has_discount: boolean;
    brand_name: string | null;
    cover_image: string | null;
}

interface Props {
    mainProduct: FBProduct;
    companions: FBProduct[];
}

export default function FrequentlyBought({ mainProduct, companions }: Props) {
    const [selected, setSelected] = useState<number[]>(companions.map(p => p.id));

    if (companions.length === 0) return null;

    const allProducts = [mainProduct, ...companions];
    const selectedProducts = allProducts.filter(p => p.id === mainProduct.id || selected.includes(p.id));
    const totalCents = selectedProducts.reduce((sum, p) => sum + p.price_cents, 0);

    const toggle = (id: number) => setSelected(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

    const addAllToCart = () => {
        const ids = selectedProducts.map(p => ({ product_id: p.id, quantity: 1 }));
        ids.forEach(item => {
            router.post('/carrinho/items', item, { preserveScroll: true, preserveState: true });
        });
    };

    return (
        <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, p: 3, mt: 6 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
                <ShoppingBagIcon color="primary" sx={{ fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Frequentemente comprados juntos</Typography>
                <Chip label={`${selectedProducts.length} itens`} size="small" color="primary" />
            </Stack>

            {/* Produtos */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                {allProducts.map((p, i) => {
                    const isMain   = p.id === mainProduct.id;
                    const checked  = isMain || selected.includes(p.id);

                    return (
                        <Stack key={p.id} direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                            {i > 0 && (
                                <Typography sx={{ color: 'text.disabled', fontWeight: 700, fontSize: 20, mx: 0.5 }}>+</Typography>
                            )}
                            <Box
                                onClick={() => !isMain && toggle(p.id)}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    border: '1px solid',
                                    borderColor: checked ? 'primary.main' : 'divider',
                                    borderRadius: 2.5, p: 1.5,
                                    cursor: isMain ? 'default' : 'pointer',
                                    bgcolor: checked ? alpha('#0B5FFF', 0.03) : 'white',
                                    transition: 'all 0.15s',
                                    '&:hover': !isMain ? { borderColor: 'primary.light' } : {},
                                    minWidth: 200, maxWidth: 240,
                                }}
                            >
                                {!isMain && (
                                    <Checkbox
                                        checked={checked}
                                        onChange={() => toggle(p.id)}
                                        size="small"
                                        sx={{ p: 0 }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                )}
                                <Avatar
                                    src={p.cover_image ?? undefined}
                                    variant="rounded"
                                    sx={{ width: 52, height: 52, bgcolor: '#F8F9FA', flexShrink: 0, '& img': { objectFit: 'contain', p: 0.5 } }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                    {isMain && (
                                        <Chip label="Este produto" size="small" color="primary" sx={{ mb: 0.4, fontSize: 10, height: 18 }} />
                                    )}
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3 }} noWrap>
                                        {p.name}
                                    </Typography>
                                    {p.brand_name && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>{p.brand_name}</Typography>
                                    )}
                                    <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: 14 }}>
                                        {formatBRL(p.price_cents)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Resumo e CTA */}
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Total dos {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} selecionados:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                        {formatBRL(totalCents)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        ou 12x de {formatBRL(Math.ceil(totalCents / 12))} sem juros
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddShoppingCartIcon />}
                    onClick={addAllToCart}
                    disabled={selectedProducts.length === 0}
                    sx={{ px: 4, fontWeight: 700 }}
                >
                    Adicionar {selectedProducts.length} {selectedProducts.length !== 1 ? 'itens' : 'item'} ao carrinho
                </Button>
            </Stack>
        </Paper>
    );
}
