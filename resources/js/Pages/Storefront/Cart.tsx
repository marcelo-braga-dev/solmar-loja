import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack, Button,
    IconButton, Divider, Avatar, TextField, Chip, LinearProgress, alpha,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BuildIcon from '@mui/icons-material/Build';
import BoltIcon from '@mui/icons-material/Bolt';
import PixIcon from '@mui/icons-material/Pix';
import { useState, type ElementType } from 'react';
import { useForm } from '@inertiajs/react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { SharedProps } from '@/Types/inertia';

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
    const { branding } = usePage<SharedProps>().props;
    const freeShippingMin = branding?.free_shipping_min_cents ?? 200000;
    const freeShippingEnabled = branding?.free_shipping_enabled ?? true;
    const freeShippingProgress = Math.min(100, (cart.total_cents / freeShippingMin) * 100);
    const remaining = Math.max(0, freeShippingMin - cart.total_cents);

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
                <Container maxWidth="md" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <ShoppingCartIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Seu carrinho está vazio</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                            Explore nosso catálogo e adicione produtos ao carrinho.
                        </Typography>
                        <Button component={Link as ElementType} href="/categorias/energia-solar" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                            Ver Catálogo
                        </Button>
                    </Box>

                    {/* Sugestões rápidas */}
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
                        Por onde começar?
                    </Typography>
                    <Grid container spacing={2}>
                        {[
                            {
                                title: 'Kits Fotovoltaicos',
                                desc: 'Solução completa: painel + inversor + estrutura',
                                icon: <BoltIcon sx={{ fontSize: 32, color: '#FFB300' }} />,
                                href: '/categorias/kits-fotovoltaicos',
                                bg: 'linear-gradient(135deg,#0D1B3E,#0B3D91)',
                            },
                            {
                                title: 'Monte seu Kit',
                                desc: 'Wizard interativo com 4 passos guiados',
                                icon: <BuildIcon sx={{ fontSize: 32, color: '#FFB300' }} />,
                                href: '/monte-seu-kit',
                                bg: 'linear-gradient(135deg,#1a0a3e,#3d0b91)',
                            },
                            {
                                title: 'Simular Economia',
                                desc: 'Descubra quanto vai economizar na conta de luz',
                                icon: <BoltIcon sx={{ fontSize: 32, color: '#FFB300' }} />,
                                href: '/simulador',
                                bg: 'linear-gradient(135deg,#0a3e1b,#0b6e3d)',
                            },
                        ].map((item) => (
                            <Grid key={item.href} size={{ xs: 12, sm: 4 }}>
                                <Paper
                                    component={Link as ElementType}
                                    href={item.href}
                                    elevation={0}
                                    sx={{
                                        display: 'block', textDecoration: 'none',
                                        background: item.bg, color: 'white',
                                        p: 3, borderRadius: 3, textAlign: 'center',
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' },
                                    }}
                                >
                                    <Box sx={{ mb: 1.5 }}>{item.icon}</Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.5 }}>{item.title}</Typography>
                                    <Typography sx={{ fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>{item.desc}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
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
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', position: 'sticky', top: 80 }}>
                            {/* Barra de progresso frete grátis */}
                            {freeShippingEnabled && (
                                <Box sx={{
                                    p: 2,
                                    bgcolor: remaining === 0 ? alpha('#16A34A', 0.06) : alpha('#0B5FFF', 0.04),
                                    borderBottom: '1px solid', borderColor: 'divider',
                                }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                                        <LocalShippingIcon sx={{ fontSize: 18, color: remaining === 0 ? 'success.main' : 'primary.main' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                                            {remaining === 0
                                                ? '🎉 Você ganhou frete grátis!'
                                                : `Falta ${formatBRL(remaining)} para frete grátis`}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={freeShippingProgress}
                                        sx={{
                                            height: 6, borderRadius: 3,
                                            bgcolor: 'rgba(0,0,0,0.08)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 3,
                                                bgcolor: remaining === 0 ? 'success.main' : 'primary.main',
                                                transition: 'transform 0.6s ease',
                                            },
                                        }}
                                    />
                                </Box>
                            )}

                            <Box sx={{ p: 3 }}>
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
                                {/* Destaque Pix */}
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    bgcolor: alpha('#16A34A', 0.07),
                                    border: '1px solid', borderColor: alpha('#16A34A', 0.2),
                                    borderRadius: 1.5, px: 1.5, py: 1,
                                }}>
                                    <PixIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'success.dark', lineHeight: 1.2 }}>
                                            Pague com Pix e economize 5%
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: 'success.main' }}>
                                            {formatBRL(Math.round(cart.total_cents * 0.95))} no Pix
                                        </Typography>
                                    </Box>
                                </Box>
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
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </StorefrontLayout>
    );
}
