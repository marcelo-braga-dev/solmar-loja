import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack, Button,
    IconButton, Divider, Avatar, TextField, Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState, type ElementType } from 'react';
import { useForm } from '@inertiajs/react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface CartItemData {
    id: number;
    product_id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    cover_image?: string;
    slug?: string;
}

interface CartData {
    id: number;
    uuid: string;
    items: CartItemData[];
    item_count: number;
    total_cents: number;
}

interface Props extends PageProps { cart: CartData }

export default function Cart({ cart }: Props) {
    const [quantities, setQuantities] = useState<Record<number, number>>(
        Object.fromEntries(cart.items.map((i) => [i.id, i.quantity]))
    );
    const couponForm = useForm({ coupon_code: '' });

    const updateQty = (itemId: number, qty: number) => {
        if (qty < 1) return;
        setQuantities((prev) => ({ ...prev, [itemId]: qty }));
        router.patch(`/carrinho/items/${itemId}`, { quantity: qty }, { preserveScroll: true, preserveState: false });
    };

    const removeItem = (itemId: number) => {
        router.delete(`/carrinho/items/${itemId}`, { preserveScroll: true, preserveState: false });
    };

    if (cart.items.length === 0) {
        return (
            <StorefrontLayout>
                <Head title="Carrinho" />
                <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                    <ShoppingCartIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Seu carrinho está vazio</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                        Explore nosso catálogo e adicione produtos ao carrinho.
                    </Typography>
                    <Button component={Link as ElementType} href="/categorias/energia-solar" variant="contained" size="large">
                        Ver Produtos
                    </Button>
                </Container>
            </StorefrontLayout>
        );
    }

    return (
        <StorefrontLayout>
            <Head title={`Carrinho (${cart.item_count})`} />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
                    Meu Carrinho
                    <Chip label={`${cart.item_count} ${cart.item_count === 1 ? 'item' : 'itens'}`} size="small" sx={{ ml: 1.5, verticalAlign: 'middle' }} />
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            {cart.items.map((item, idx) => (
                                <Box key={item.id}>
                                    {idx > 0 && <Divider />}
                                    <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
                                        <Avatar
                                            src={item.cover_image}
                                            variant="rounded"
                                            sx={{ width: 80, height: 80, bgcolor: 'grey.100', flexShrink: 0 }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="body1"
                                                component={item.slug ? Link : 'span'}
                                                href={item.slug ? `/produtos/${item.slug}` : undefined}
                                                sx={{ fontWeight: 600, display: 'block', color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                                            >
                                                {item.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                                SKU: {item.sku}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, mt: 0.5 }}>
                                                {formatBRL(item.unit_price_cents)} / un.
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                                            <IconButton size="small" onClick={() => updateQty(item.id, (quantities[item.id] ?? 1) - 1)} disabled={(quantities[item.id] ?? 1) <= 1}>
                                                −
                                            </IconButton>
                                            <TextField
                                                value={quantities[item.id] ?? item.quantity}
                                                onChange={(e) => updateQty(item.id, Number(e.target.value))}
                                                type="number"
                                                size="small"
                                                sx={{ width: 60 }}
                                                slotProps={{ input: { inputProps: { min: 1, style: { textAlign: 'center' } } } }}
                                            />
                                            <IconButton size="small" onClick={() => updateQty(item.id, (quantities[item.id] ?? 1) + 1)}>+</IconButton>
                                        </Stack>

                                        <Typography variant="h6" sx={{ fontWeight: 700, flexShrink: 0, minWidth: 100, textAlign: 'right' }}>
                                            {formatBRL(item.unit_price_cents * (quantities[item.id] ?? item.quantity))}
                                        </Typography>

                                        <IconButton color="error" onClick={() => removeItem(item.id)} size="small">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            ))}
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, position: 'sticky', top: 80 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resumo do pedido</Typography>

                            {/* Cupom */}
                            <Box
                                component="form"
                                onSubmit={(e) => { e.preventDefault(); couponForm.post('/carrinho/coupon'); }}
                                sx={{ display: 'flex', gap: 1, mb: 2 }}
                            >
                                <TextField
                                    size="small"
                                    placeholder="Código do cupom"
                                    value={couponForm.data.coupon_code}
                                    onChange={(e) => couponForm.setData('coupon_code', e.target.value.toUpperCase())}
                                    error={!!couponForm.errors.coupon_code}
                                    helperText={couponForm.errors.coupon_code}
                                    sx={{ flex: 1 }}
                                />
                                <Button type="submit" variant="outlined" size="small" disabled={couponForm.processing}>
                                    Aplicar
                                </Button>
                            </Box>

                            <Stack spacing={1.5} sx={{ mb: 3 }}>
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal ({cart.item_count} itens)</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatBRL(cart.total_cents)}</Typography>
                                </Stack>
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Frete</Typography>
                                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>Calcular no checkout</Typography>
                                </Stack>
                                <Divider />
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatBRL(cart.total_cents)}</Typography>
                                </Stack>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    ou em até 12x sem juros no cartão
                                </Typography>
                            </Stack>

                            <Button
                                component={Link as ElementType}
                                href="/checkout"
                                variant="contained"
                                size="large"
                                fullWidth
                                endIcon={<ArrowForwardIcon />}
                                sx={{ py: 1.5, fontWeight: 700 }}
                            >
                                Finalizar Compra
                            </Button>

                            <Button
                                component={Link as ElementType}
                                href="/categorias/energia-solar"
                                variant="text"
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                Continuar comprando
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </StorefrontLayout>
    );
}
