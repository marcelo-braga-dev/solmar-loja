import { Head, Link } from '@inertiajs/react';
import { type ElementType, useEffect, useState } from 'react';
import {
    Box, Container, Typography, Grid, Paper, Stack, Chip, Button,
    Table, TableBody, TableCell, TableHead, TableRow, Avatar, Divider, alpha,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { formatBRL, formatInstallment } from '@/Lib/formatters';
import { useComparison } from '@/Hooks/useComparison';
import type { PageProps } from '@inertiajs/react';

// A página recebe os produtos via query param ?ids=1,2,3,4
// O backend resolve os produtos e os passa como prop
interface CompareProduct {
    id: number;
    name: string;
    slug: string;
    price_cents: number;
    compare_at_price_cents: number | null;
    has_discount: boolean;
    discount_percent: number;
    cover_image: string | null;
    brand_name: string | null;
    brand?: { name: string; slug: string } | null;
    sku: string;
    weight_grams: number | null;
    specifications: Record<string, string> | null;
    categories?: string[];
    short_description: string | null;
    in_stock: boolean;
}

interface Props extends PageProps {
    products: CompareProduct[];
}

const COLORS = ['#0B5FFF', '#7C3AED', '#059669', '#EA580C'];

function SpecRow({ label, values }: { label: string; values: (string | null | undefined)[] }) {
    const allSame = values.every(v => v === values[0]);
    return (
        <TableRow hover>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', bgcolor: '#FAFAFA', width: 160 }}>
                {label}
            </TableCell>
            {values.map((val, i) => (
                <TableCell key={i} align="center" sx={{
                    fontSize: 13,
                    color: allSame ? 'text.primary' : val ? 'text.primary' : 'text.disabled',
                    bgcolor: !allSame && val ? alpha(COLORS[i] ?? '#0B5FFF', 0.04) : 'transparent',
                    fontWeight: !allSame && val ? 600 : 400,
                }}>
                    {val ?? '—'}
                </TableCell>
            ))}
        </TableRow>
    );
}

export default function Compare({ products }: Props) {
    const { clear, remove } = useComparison();

    const allSpecs = [...new Set(
        products.flatMap(p => Object.keys(p.specifications ?? {}))
    )];

    if (products.length === 0) {
        return (
            <StorefrontLayout>
                <Head title="Comparar Produtos" />
                <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                    <CompareArrowsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Nenhum produto para comparar</Typography>
                    <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                        Adicione produtos à comparação clicando em "Comparar" nos cards da loja.
                    </Typography>
                    <Button component={Link as ElementType} href="/categorias/energia-solar" variant="contained" size="large">
                        Explorar Produtos
                    </Button>
                </Container>
            </StorefrontLayout>
        );
    }

    return (
        <StorefrontLayout>
            <Head title={`Comparar ${products.length} Produtos — SolarHub Commerce`} />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                            <CompareArrowsIcon color="primary" />
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Comparação de Produtos</Typography>
                            <Chip label={`${products.length} produtos`} size="small" color="primary" />
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, ml: 4.5 }}>
                            Analise as diferenças e escolha o melhor para você
                        </Typography>
                    </Box>
                    <Button variant="outlined" size="small" onClick={() => { clear(); history.back(); }}>
                        Limpar comparação
                    </Button>
                </Stack>

                <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                        {/* Cabeçalho com imagens e nome */}
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'white' }}>
                                <TableCell sx={{ width: 160, bgcolor: '#FAFAFA', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Produto
                                    </Typography>
                                </TableCell>
                                {products.map((p, i) => (
                                    <TableCell key={p.id} align="center" sx={{ borderLeft: `3px solid ${COLORS[i] ?? '#ccc'}`, verticalAlign: 'top', p: 2.5 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                component="img"
                                                src={p.cover_image ?? '/images/placeholder.png'}
                                                alt={p.name}
                                                sx={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 2, bgcolor: '#F8F9FA', p: 1 }}
                                            />
                                            {p.has_discount && (
                                                <Chip label={`-${p.discount_percent}%`} size="small" color="error" sx={{ fontWeight: 700, fontSize: 11 }} />
                                            )}
                                            <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                                                <Box component={Link as ElementType} href={`/produtos/${p.slug}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                                    {p.name}
                                                </Box>
                                            </Typography>
                                            {p.brand_name && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    {p.brand_name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {/* Preço */}
                            <TableRow sx={{ bgcolor: '#F8FAFF' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13, bgcolor: '#FAFAFA' }}>Preço</TableCell>
                                {products.map((p, i) => (
                                    <TableCell key={p.id} align="center" sx={{ borderLeft: `3px solid ${COLORS[i] ?? '#ccc'}` }}>
                                        {p.compare_at_price_cents && p.has_discount && (
                                            <Typography variant="caption" sx={{ color: 'text.disabled', textDecoration: 'line-through', display: 'block' }}>
                                                {formatBRL(p.compare_at_price_cents)}
                                            </Typography>
                                        )}
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: p.has_discount ? '#DC2626' : 'primary.main', lineHeight: 1 }}>
                                            {formatBRL(p.price_cents)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {formatInstallment(p.price_cents)} sem juros
                                        </Typography>
                                    </TableCell>
                                ))}
                            </TableRow>

                            {/* Disponibilidade */}
                            <SpecRow label="Disponibilidade" values={products.map(p => p.in_stock ? '✓ Em estoque' : '✗ Fora de estoque')} />

                            {/* SKU */}
                            <SpecRow label="SKU" values={products.map(p => p.sku)} />

                            {/* Peso */}
                            <SpecRow label="Peso" values={products.map(p => p.weight_grams ? `${(p.weight_grams / 1000).toFixed(1)} kg` : null)} />

                            {/* Specs dinâmicas */}
                            {allSpecs.map(spec => (
                                <SpecRow
                                    key={spec}
                                    label={spec}
                                    values={products.map(p => p.specifications?.[spec] ?? null)}
                                />
                            ))}

                            {/* Botão comprar */}
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#FAFAFA' }} />
                                {products.map((p, i) => (
                                    <TableCell key={p.id} align="center" sx={{ borderLeft: `3px solid ${COLORS[i] ?? '#ccc'}`, py: 2.5 }}>
                                        <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                            <Button
                                                component={Link as ElementType}
                                                href={`/produtos/${p.slug}`}
                                                variant="contained"
                                                startIcon={<AddShoppingCartIcon />}
                                                size="small"
                                                fullWidth
                                                sx={{ bgcolor: COLORS[i] ?? 'primary.main', '&:hover': { filter: 'brightness(0.9)' } }}
                                            >
                                                Ver produto
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="error"
                                                onClick={() => remove(p.id)}
                                                sx={{ fontSize: 11 }}
                                            >
                                                Remover da comparação
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </Paper>
            </Container>
        </StorefrontLayout>
    );
}
