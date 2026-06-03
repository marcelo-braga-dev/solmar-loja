import { Head, Link, usePage } from '@inertiajs/react';
import {
    Box, Container, Typography, Button, Stack, Grid,
    Paper, Chip, Avatar,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedIcon from '@mui/icons-material/Verified';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import SecurityIcon from '@mui/icons-material/Security';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import type { PageProps } from '@inertiajs/react';
import type { Product, Category, Brand } from '@/Types/catalog';
import type { SharedProps } from '@/Types/inertia';

interface Props extends PageProps {
    featuredProducts: Product[];
    onSaleProducts: Product[];
    mainCategories: Category[];
    brands: Brand[];
}

function formatBRLShort(cents: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cents / 100);
}

export default function Home({ featuredProducts, onSaleProducts, mainCategories, brands }: Props) {
    const { branding } = usePage<SharedProps>().props;
    const freeShippingMin = branding?.free_shipping_min_cents ?? 200000;
    const freeShippingEnabled = branding?.free_shipping_enabled ?? true;

    const BENEFITS = [
        { icon: <LocalShippingIcon />, title: 'Frete Grátis', desc: freeShippingEnabled ? `Nas compras acima de ${formatBRLShort(freeShippingMin)}` : 'Consulte condições' },
        { icon: <PaymentIcon />, title: 'Parcele em 12x', desc: 'Sem juros no cartão de crédito' },
        { icon: <VerifiedIcon />, title: 'Garantia do Fabricante', desc: 'Produtos originais certificados' },
        { icon: <HeadsetMicIcon />, title: 'Suporte Técnico', desc: 'Especialistas em energia solar' },
        { icon: <SecurityIcon />, title: 'Compra Segura', desc: 'Pagamento criptografado SSL' },
    ];

    return (
        <StorefrontLayout>
            <Head title="Início — Energia Solar no Brasil" />

            {/* Hero */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #0B5FFF 0%, #0040CC 60%, #003399 100%)',
                    color: 'white',
                    py: { xs: 8, md: 12 },
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute', inset: 0, opacity: 0.05,
                        backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                        backgroundSize: '20px 20px',
                    }}
                />
                <Container maxWidth="lg" sx={{ position: 'relative' }}>
                    <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center' }}>
                        <SolarPowerIcon sx={{ fontSize: 72, color: '#FFB300' }} />
                        <Box>
                            <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2rem', md: '3.5rem' } }}>
                                Energia Solar para o Brasil
                            </Typography>
                            <Typography variant="h5" sx={{ opacity: 0.85, maxWidth: 640, mx: 'auto', fontWeight: 400 }}>
                                Painéis solares, inversores, kits completos e tudo que você precisa para gerar sua própria energia.
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                component={Link}
                                href="/categorias/energia-solar"
                                variant="contained"
                                size="large"
                                sx={{ bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 700, px: 4, '&:hover': { bgcolor: '#e6a200' } }}
                            >
                                Ver Catálogo Completo
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                sx={{ borderColor: 'rgba(255,255,255,0.6)', color: 'white', px: 4, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' } }}
                            >
                                Simular Economia
                            </Button>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                            {['Frete Grátis', 'Parcelamento em 12x', 'Garantia Fabricante', 'Suporte Especializado'].map((label) => (
                                <Chip key={label} label={label} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 500 }} />
                            ))}
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* Benefícios */}
            <Box sx={{ bgcolor: 'white', py: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
                        {BENEFITS.map((b) => (
                            <Grid key={b.title} size={{ xs: 6, sm: 4, md: 'auto' }}>
                                <Stack sx={{ alignItems: 'center', textAlign: 'center', px: 2, py: 1 }}>
                                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', mb: 1, width: 44, height: 44 }}>
                                        {b.icon}
                                    </Avatar>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{b.title}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{b.desc}</Typography>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Categorias principais */}
            {mainCategories.length > 0 && (
                <Container maxWidth="lg" sx={{ py: 6 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Categorias</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                        Encontre tudo para o seu sistema de energia solar
                    </Typography>
                    <Grid container spacing={2.5}>
                        {mainCategories.map((cat) => (
                            <Grid key={cat.id} size={{ xs: 6, sm: 4, md: 3, lg: 3 }}>
                                <Paper
                                    component={Link}
                                    href={`/categorias/${cat.slug}`}
                                    elevation={0}
                                    sx={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        justifyContent: 'center', p: 3, textAlign: 'center',
                                        border: '1px solid', borderColor: 'divider', borderRadius: 3,
                                        textDecoration: 'none', color: 'inherit', minHeight: 120,
                                        transition: 'all 0.2s', cursor: 'pointer',
                                        '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50', transform: 'translateY(-2px)', boxShadow: 2 },
                                    }}
                                >
                                    <Typography variant="h4" component="span" sx={{ mb: 1 }}>
                                        ☀️
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{cat.name}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            )}

            {/* Ofertas */}
            {onSaleProducts.length > 0 && (
                <Box sx={{ bgcolor: 'error.50', py: 6 }}>
                    <Container maxWidth="lg">
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>🔥 Ofertas Especiais</Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>Preços imperdíveis por tempo limitado</Typography>
                            </Box>
                            <Button component={Link} href="/ofertas" variant="outlined" color="error">
                                Ver todas
                            </Button>
                        </Stack>
                        <Grid container spacing={3}>
                            {onSaleProducts.map((product) => (
                                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <ProductCard product={product} />
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>
            )}

            {/* Produtos em destaque */}
            {featuredProducts.length > 0 && (
                <Container maxWidth="lg" sx={{ py: 6 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>⭐ Destaques</Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>Produtos mais buscados e avaliados</Typography>
                        </Box>
                        <Button component={Link} href="/categorias/energia-solar" variant="outlined">
                            Ver catálogo
                        </Button>
                    </Stack>
                    <Grid container spacing={3}>
                        {featuredProducts.map((product) => (
                            <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                <ProductCard product={product} />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            )}

            {/* Marcas */}
            {brands.length > 0 && (
                <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
                    <Container maxWidth="lg">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                            Marcas Parceiras
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 4 }}>
                            Trabalhamos com os maiores fabricantes do mundo
                        </Typography>
                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                            {brands.map((brand) => (
                                <Paper
                                    key={brand.id}
                                    component={Link}
                                    href={`/marcas/${brand.slug}`}
                                    elevation={0}
                                    sx={{
                                        px: 3, py: 1.5, border: '1px solid', borderColor: 'divider',
                                        borderRadius: 2, textDecoration: 'none', color: 'text.secondary',
                                        fontWeight: 600, fontSize: 14,
                                        '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {brand.name}
                                </Paper>
                            ))}
                        </Stack>
                    </Container>
                </Box>
            )}

            {/* CTA final */}
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                        Pronto para economizar na conta de luz?
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400 }}>
                        Simule agora mesmo a economia que você terá com energia solar.
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                        <Button
                            size="large"
                            variant="contained"
                            sx={{ bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 700, px: 5 }}
                        >
                            Simular Agora
                        </Button>
                        <Button
                            component={Link}
                            href="/categorias/kits-fotovoltaicos"
                            size="large"
                            variant="outlined"
                            sx={{ borderColor: 'white', color: 'white', px: 5 }}
                        >
                            Ver Kits
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </StorefrontLayout>
    );
}
