import { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Box, Container, Typography, Button, Stack, Grid, Paper, Avatar, Chip, alpha } from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedIcon from '@mui/icons-material/Verified';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BoltIcon from '@mui/icons-material/Bolt';
import Co2Icon from '@mui/icons-material/Co2';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import StarIcon from '@mui/icons-material/Star';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LockIcon from '@mui/icons-material/Lock';
import GppGoodIcon from '@mui/icons-material/GppGood';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ArticleIcon from '@mui/icons-material/Article';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import ProductCard from '@/Components/storefront/ProductCard';
import type { PageProps } from '@inertiajs/react';
import type { Product, Brand } from '@/Types/catalog';
import type { SharedProps } from '@/Types/inertia';

interface PostTeaser {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    published_at: string;
    reading_time: number;
}

interface Props extends PageProps {
    featuredProducts: Product[];
    onSaleProducts: Product[];
    generatorProducts: Product[];
    brands: Brand[];
    latestPosts: PostTeaser[];
}

/** Revela a seção com fade + slide-up suave quando ela entra na viewport. */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <Box
            ref={ref}
            sx={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            {children}
        </Box>
    );
}

function formatBRLShort(cents: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cents / 100);
}

const TESTIMONIALS = [
    { name: 'Roberto Alves', city: 'São Paulo, SP', text: 'Comprei um kit solar completo e a economia na conta de luz foi incrível. Em 4 anos já se pagou! Suporte técnico excelente.', rating: 5, product: 'Kit 5kWp On-Grid' },
    { name: 'Maria Fernanda', city: 'Belo Horizonte, MG', text: 'Atendimento impecável. Os painéis chegaram antes do prazo e a qualidade é superior. Recomendo para qualquer pessoa querendo energia solar.', rating: 5, product: 'Painel Solar 550W' },
    { name: 'Carlos Eduardo', city: 'Curitiba, PR', text: 'A plataforma é muito fácil de usar. Fiz a cotação, tirei dúvidas pelo chat e recebi tudo em perfeito estado. Nota 10!', rating: 5, product: 'Inversor Fronius 5kW' },
];

const STATS = [
    { value: '15.000+', label: 'Clientes atendidos', icon: <HeadsetMicIcon sx={{ fontSize: 28 }} /> },
    { value: '50 MW+', label: 'Instalados no Brasil', icon: <SolarPowerIcon sx={{ fontSize: 28 }} /> },
    { value: '12.000+', label: 'Pedidos entregues', icon: <LocalShippingIcon sx={{ fontSize: 28 }} /> },
    { value: '25 anos', label: 'Garantia de geração', icon: <VerifiedIcon sx={{ fontSize: 28 }} /> },
];

const WHY_US = [
    { icon: <LockIcon />, title: 'Compra 100% Segura', desc: 'Pagamento criptografado (SSL) e proteção antifraude em todas as etapas.', color: '#0B5FFF' },
    { icon: <WorkspacePremiumIcon />, title: 'Produtos Homologados', desc: 'Painéis e inversores certificados INMETRO, compatíveis com as normas da ANEEL.', color: '#7C3AED' },
    { icon: <InsightsIcon />, title: 'Simulador Inteligente', desc: 'Calcule sua economia real em segundos com dados de irradiação e tarifa do seu estado.', color: '#059669' },
    { icon: <SupportAgentIcon />, title: 'Equipe Especializada', desc: 'Suporte técnico humano antes, durante e depois da sua compra.', color: '#EA580C' },
    { icon: <VerifiedIcon />, title: 'Garantia Estendida', desc: 'Até 25 anos de garantia de geração nos painéis solares.', color: '#DC2626' },
    { icon: <LocalShippingIcon />, title: 'Entrega Monitorada', desc: 'Rastreamento em tempo real e frete para todo o território nacional.', color: '#0284C7' },
];

const HOW_IT_WORKS = [
    { step: '01', icon: <BuildIcon />, title: 'Escolha ou monte seu kit', desc: 'Catálogo completo ou Kit Builder guiado passo a passo.' },
    { step: '02', icon: <BoltIcon />, title: 'Simule sua economia', desc: 'Veja o payback estimado antes de fechar a compra.' },
    { step: '03', icon: <PaymentIcon />, title: 'Compre com segurança', desc: 'Pix, boleto ou cartão em até 12x sem juros.' },
    { step: '04', icon: <SolarPowerIcon />, title: 'Receba e gere energia', desc: 'Entrega rastreada e suporte na instalação do seu sistema.' },
];

export default function Home({ featuredProducts, onSaleProducts, generatorProducts, brands, latestPosts }: Props) {
    const { branding } = usePage<SharedProps>().props;
    const freeShippingMin = branding?.free_shipping_min_cents ?? 200000;
    const freeShippingEnabled = branding?.free_shipping_enabled ?? true;

    const BENEFITS = [
        { icon: <LocalShippingIcon />, title: 'Frete Grátis', desc: freeShippingEnabled ? `Acima de ${formatBRLShort(freeShippingMin)}` : 'Consulte condições' },
        { icon: <PaymentIcon />,       title: 'Parcele em 12x', desc: 'Sem juros no cartão' },
        { icon: <VerifiedIcon />,      title: 'Garantia Total', desc: 'Produtos originais' },
        { icon: <HeadsetMicIcon />,    title: 'Suporte Solar', desc: 'Especialistas disponíveis' },
        { icon: <SecurityIcon />,      title: 'Compra Segura', desc: 'SSL & antifraude' },
    ];

    return (
        <StorefrontLayout>
            <Head title="Início" />

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0D1B3E 0%, #0B3D91 40%, #0B5FFF 100%)',
                color: 'white',
                pt: { xs: 10, md: 14 },
                pb: { xs: 8, md: 12 },
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Anéis decorativos */}
                {[500, 750, 1000].map((size, i) => (
                    <Box key={i} sx={{
                        position: 'absolute',
                        width: size, height: size,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.05)',
                        top: '50%', left: '60%',
                        transform: 'translate(-50%,-50%)',
                        display: { xs: 'none', md: 'block' },
                    }} />
                ))}
                {/* Grid overlay */}
                <Box sx={{
                    position: 'absolute', inset: 0, opacity: 0.04,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />

                <Container maxWidth="lg" sx={{ position: 'relative' }}>
                    <Grid container spacing={6} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Chip
                                label="🇧🇷 A maior plataforma solar do Brasil"
                                sx={{ bgcolor: 'rgba(255,179,0,0.18)', color: '#FFD54F', fontWeight: 600, mb: 3, fontSize: 12, border: '1px solid rgba(255,179,0,0.25)' }}
                            />
                            <Typography variant="h1" sx={{
                                fontWeight: 900, lineHeight: 1.05,
                                fontSize: { xs: '2.4rem', sm: '3rem', md: '3.8rem' },
                                mb: 2,
                                letterSpacing: '-1px',
                            }}>
                                Energia Solar<br />
                                <Box component="span" sx={{
                                    background: 'linear-gradient(90deg,#FFB300,#FFD54F)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    para todo o Brasil
                                </Box>
                            </Typography>
                            <Typography sx={{ fontSize: { xs: 16, md: 18 }, opacity: 0.8, mb: 4, maxWidth: 520, lineHeight: 1.7 }}>
                                Painéis solares, inversores, kits fotovoltaicos completos e tudo que você precisa para gerar sua própria energia limpa e economizar na conta de luz.
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                                <Button
                                    component={Link}
                                    href="/categorias/energia-solar"
                                    variant="contained"
                                    size="large"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 800,
                                        px: 4, py: 1.6, fontSize: 16, borderRadius: 2,
                                        boxShadow: '0 8px 24px rgba(255,179,0,0.4)',
                                        '&:hover': { bgcolor: '#e6a200', transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(255,179,0,0.5)' },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Ver Catálogo
                                </Button>
                                <Button
                                    component={Link}
                                    href="/simulador"
                                    variant="outlined"
                                    size="large"
                                    startIcon={<BoltIcon />}
                                    sx={{
                                        borderColor: 'rgba(255,255,255,0.4)', color: 'white',
                                        px: 4, py: 1.6, fontSize: 16, borderRadius: 2,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' },
                                    }}
                                >
                                    Simular Economia
                                </Button>
                            </Stack>

                            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 3 }}>
                                {[
                                    { icon: '✓', text: 'Frete Grátis' },
                                    { icon: '✓', text: 'Parcele em 12x' },
                                    { icon: '✓', text: 'Entrega em todo Brasil' },
                                ].map((item) => (
                                    <Stack key={item.text} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                        <Typography sx={{ color: '#FFB300', fontWeight: 700 }}>{item.icon}</Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{item.text}</Typography>
                                    </Stack>
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={2.5} sx={{ flexWrap: 'wrap', rowGap: 1.5, alignItems: 'center', pt: 1, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} sx={{ color: '#FFB300', fontSize: 16 }} />
                                    ))}
                                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, ml: 0.5 }}>
                                        4,9/5 · 1.200+ avaliações
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                                    <GppGoodIcon sx={{ fontSize: 17, color: 'rgba(255,255,255,0.6)' }} />
                                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Site seguro · dados protegidos</Typography>
                                </Stack>
                            </Stack>
                        </Grid>

                        {/* Lado direito — visual */}
                        <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                            <Box sx={{ position: 'relative', width: 380, height: 380 }}>
                                {/* Glow */}
                                <Box sx={{
                                    position: 'absolute', inset: '-20%',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(255,179,0,0.25) 0%, transparent 70%)',
                                }} />
                                {/* Sol central */}
                                <Box sx={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Box sx={{
                                        width: 180, height: 180, borderRadius: '50%',
                                        background: 'radial-gradient(circle,#FFD54F 0%,#FFB300 60%,rgba(255,179,0,0.3) 100%)',
                                        boxShadow: '0 0 80px rgba(255,179,0,0.6), 0 0 160px rgba(255,179,0,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        animation: 'spin 20s linear infinite',
                                        '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                                    }}>
                                        <SolarPowerIcon sx={{ fontSize: 72, color: 'white', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))', animation: 'spin 20s linear infinite reverse' }} />
                                    </Box>
                                </Box>
                                {/* Badges flutuantes */}
                                {[
                                    { top: '10%', right: '-5%', icon: <Co2Icon />, label: '-85%', sub: 'menos CO₂' },
                                    { bottom: '15%', left: '-8%', icon: <BoltIcon />, label: '25 anos', sub: 'de garantia' },
                                    { top: '55%', right: '-10%', icon: <EmojiNatureIcon />, label: 'R$ 0', sub: 'de ICMS solar' },
                                ].map((badge, i) => (
                                    <Box key={i} sx={{
                                        position: 'absolute',
                                        top: badge.top, bottom: badge.bottom,
                                        left: badge.left, right: badge.right,
                                        bgcolor: 'rgba(255,255,255,0.12)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: 2.5, px: 1.5, py: 1,
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        minWidth: 120,
                                    }}>
                                        <Box sx={{ color: '#FFB300' }}>{badge.icon}</Box>
                                        <Box>
                                            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>{badge.label}</Typography>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{badge.sub}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ── BENEFITS BAR ──────────────────────────────────────────────── */}
            <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 0 }}>
                <Container maxWidth="lg">
                    <Grid container>
                        {BENEFITS.map((b, i) => (
                            <Grid key={b.title} size={{ xs: 6, md: 'grow' }}>
                                <Stack
                                    direction="row"
                                    spacing={1.5}
                                    sx={{
                                        alignItems: 'center', py: 2.5, px: 2,
                                        borderRight: i < BENEFITS.length - 1 ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Box sx={{
                                        width: 40, height: 40, borderRadius: 2,
                                        bgcolor: alpha('#0B5FFF', 0.08),
                                        color: 'primary.main',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {b.icon}
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>{b.title}</Typography>
                                        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.3 }}>{b.desc}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
            <Reveal>
                <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#F8F9FC' }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Chip label="Como funciona" color="primary" size="small" sx={{ mb: 1.5, fontWeight: 600 }} />
                            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px', fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                                Da escolha à energia gerada, em 4 passos
                            </Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: 16, maxWidth: 560, mx: 'auto' }}>
                                Um processo simples, transparente e acompanhado por especialistas do início ao fim
                            </Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {HOW_IT_WORKS.map((item, i) => (
                                <Grid key={item.step} size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{
                                        position: 'relative', height: '100%',
                                        bgcolor: 'white', borderRadius: 3, p: 3,
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        transition: 'all 0.25s',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(11,95,255,0.12)' },
                                    }}>
                                        <Typography sx={{ position: 'absolute', top: 12, right: 16, fontSize: 36, fontWeight: 900, color: alpha('#0B5FFF', 0.07), lineHeight: 1 }}>
                                            {item.step}
                                        </Typography>
                                        <Box sx={{
                                            width: 48, height: 48, borderRadius: 2.5,
                                            bgcolor: alpha('#0B5FFF', 0.08), color: 'primary.main',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                                        }}>
                                            {item.icon}
                                        </Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: 15.5, mb: 0.5 }}>{item.title}</Typography>
                                        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.5 }}>{item.desc}</Typography>
                                        {i < HOW_IT_WORKS.length - 1 && (
                                            <ArrowForwardIcon sx={{
                                                display: { xs: 'none', md: 'block' },
                                                position: 'absolute', top: '50%', right: -34, transform: 'translateY(-50%)',
                                                color: alpha('#0B5FFF', 0.25), fontSize: 22,
                                            }} />
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>
            </Reveal>

            {/* ── STATS ─────────────────────────────────────────────────────── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0D1B3E 0%, #0B3D91 100%)',
                py: 5,
            }}>
                <Container maxWidth="lg">
                    <Grid container spacing={2}>
                        {STATS.map((s) => (
                            <Grid key={s.label} size={{ xs: 6, md: 3 }}>
                                <Stack sx={{ alignItems: 'center', textAlign: 'center', py: 1 }}>
                                    <Box sx={{ color: '#FFB300', mb: 1 }}>{s.icon}</Box>
                                    <Typography sx={{ color: 'white', fontWeight: 900, fontSize: { xs: 24, md: 32 }, lineHeight: 1 }}>
                                        {s.value}
                                    </Typography>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, mt: 0.5 }}>
                                        {s.label}
                                    </Typography>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ── POR QUE COMPRAR COM A LOJA ───────────────────────────── */}
            <Reveal>
                <Box sx={{ py: { xs: 7, md: 9 }, bgcolor: 'white' }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Chip label={`Por que a ${branding?.store_name || 'nossa loja'}`} color="primary" size="small" sx={{ mb: 1.5, fontWeight: 600 }} />
                            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px', fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                                Tecnologia, segurança e gente especialista
                            </Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: 16, maxWidth: 560, mx: 'auto' }}>
                                Tudo o que você precisa para comprar com confiança e investir em energia solar sem riscos
                            </Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {WHY_US.map((item) => (
                                <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        sx={{
                                            p: 2.5, borderRadius: 3, height: '100%',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            transition: 'all 0.25s',
                                            '&:hover': { borderColor: alpha(item.color, 0.3), bgcolor: alpha(item.color, 0.03) },
                                        }}
                                    >
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
                                            bgcolor: alpha(item.color, 0.1), color: item.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {item.icon}
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.4 }}>{item.title}</Typography>
                                            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.5 }}>{item.desc}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>
            </Reveal>

            {/* ── GERADORES FOTOVOLTAICOS ──────────────────────────────────── */}
            {generatorProducts.length > 0 && (
              <Reveal>
                <Box sx={{ py: 8, bgcolor: '#F8F9FC' }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Chip label="Nosso Catálogo" color="primary" size="small" sx={{ mb: 1.5, fontWeight: 600 }} />
                            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                                Geradores Fotovoltaicos para todo tipo de consumo
                            </Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: 16, maxWidth: 560, mx: 'auto' }}>
                                Kits completos, prontos para instalar — escolha a potência ideal e comece a gerar sua própria energia
                            </Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {generatorProducts.map((product) => (
                                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <ProductCard product={product} />
                                </Grid>
                            ))}
                        </Grid>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center', mt: 5 }}>
                            <Button
                                component={Link}
                                href="/categorias/kits-fotovoltaicos"
                                size="large"
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ fontWeight: 700, px: 4, py: 1.3 }}
                            >
                                Ver Geradores Fotovoltaicos
                            </Button>
                            <Button
                                component={Link}
                                href="/busca"
                                size="large"
                                variant="outlined"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ fontWeight: 700, px: 4, py: 1.3 }}
                            >
                                Ver todos os produtos
                            </Button>
                        </Stack>
                    </Container>
                </Box>
              </Reveal>
            )}

            {/* ── KIT BUILDER PROMO ────────────────────────────────────────── */}
            <Reveal>
              <Box sx={{
                background: 'linear-gradient(135deg, #0D1B3E 0%, #0B2454 60%, #0F172A 100%)',
                py: { xs: 7, md: 9 },
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Padrão decorativo */}
                <Box sx={{
                    position: 'absolute', inset: 0, opacity: 0.05,
                    backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,179,0,0.9) 0%, transparent 50%)',
                }} />
                <Container maxWidth="lg" sx={{ position: 'relative' }}>
                    <Grid container spacing={5} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Chip
                                label="🔧 Novidade"
                                sx={{ bgcolor: 'rgba(255,179,0,0.18)', color: '#FFD54F', fontWeight: 700, mb: 2.5, border: '1px solid rgba(255,179,0,0.25)' }}
                            />
                            <Typography variant="h3" sx={{
                                color: 'white', fontWeight: 900, lineHeight: 1.1,
                                fontSize: { xs: '2rem', md: '2.6rem' },
                                mb: 2, letterSpacing: '-0.5px',
                            }}>
                                Monte seu sistema solar{' '}
                                <Box component="span" sx={{
                                    background: 'linear-gradient(90deg,#FFB300,#FFD54F)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    do zero
                                </Box>
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, mb: 4, lineHeight: 1.7, maxWidth: 480 }}>
                                Nosso wizard interativo escolhe painel, inversor, estrutura e cabos compatíveis para o seu consumo. Em 4 passos, seu kit completo no carrinho.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    component={Link}
                                    href="/monte-seu-kit"
                                    variant="contained"
                                    size="large"
                                    startIcon={<BuildIcon />}
                                    sx={{
                                        bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 800,
                                        px: 4, py: 1.6, fontSize: 16, borderRadius: 2,
                                        boxShadow: '0 8px 24px rgba(255,179,0,0.35)',
                                        '&:hover': { bgcolor: '#e6a200', transform: 'translateY(-1px)' },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Montar meu Kit
                                </Button>
                                <Button
                                    component={Link}
                                    href="/simulador"
                                    variant="outlined"
                                    size="large"
                                    startIcon={<BoltIcon />}
                                    sx={{
                                        borderColor: 'rgba(255,255,255,0.35)', color: 'white', fontWeight: 600,
                                        px: 4, py: 1.6, fontSize: 16, borderRadius: 2,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'white' },
                                    }}
                                >
                                    Simular primeiro
                                </Button>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Stack spacing={1.5}>
                                {[
                                    { step: '01', title: 'Escolha o Painel Solar', desc: 'Potência ideal para seu telhado' },
                                    { step: '02', title: 'Selecione o Inversor', desc: 'Compatível com os painéis escolhidos' },
                                    { step: '03', title: 'Estrutura de Fixação', desc: 'Telha cerâmica, metálica ou laje' },
                                    { step: '04', title: 'Cabos e Conectores', desc: 'Kit completo adicionado ao carrinho' },
                                ].map((item) => (
                                    <Box
                                        key={item.step}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 2,
                                            bgcolor: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 2, px: 2.5, py: 1.5,
                                            backdropFilter: 'blur(8px)',
                                        }}
                                    >
                                        <Typography sx={{ color: '#FFB300', fontWeight: 900, fontSize: 13, minWidth: 28, opacity: 0.7 }}>
                                            {item.step}
                                        </Typography>
                                        <Box>
                                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{item.title}</Typography>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{item.desc}</Typography>
                                        </Box>
                                        <CheckCircleIcon sx={{ ml: 'auto', color: '#FFB300', fontSize: 18, opacity: 0.6 }} />
                                    </Box>
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
              </Box>
            </Reveal>

            {/* ── OFERTAS ───────────────────────────────────────────────────── */}
            {onSaleProducts.length > 0 && (
              <Reveal>
                <Box sx={{ py: 8, bgcolor: 'white' }}>
                    <Container maxWidth="lg">
                        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 5 }}>
                            <Box>
                                <Chip label="🔥 Promoções" sx={{ bgcolor: alpha('#DC2626', 0.08), color: '#DC2626', fontWeight: 700, mb: 1 }} />
                                <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                                    Ofertas Especiais
                                </Typography>
                                <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    Preços imperdíveis por tempo limitado
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/busca?on_sale=1"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ mt: { xs: 2, sm: 0 }, fontWeight: 600 }}
                            >
                                Ver todas as ofertas
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
              </Reveal>
            )}

            {/* ── DESTAQUES ─────────────────────────────────────────────────── */}
            {featuredProducts.length > 0 && (
              <Reveal>
                <Box sx={{ py: 8, bgcolor: '#F8F9FC' }}>
                    <Container maxWidth="lg">
                        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 5 }}>
                            <Box>
                                <Chip label="⭐ Top Produtos" sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#B45309', fontWeight: 700, mb: 1 }} />
                                <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                                    Mais Vendidos
                                </Typography>
                                <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    Os produtos mais escolhidos pelos nossos clientes
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/categorias/energia-solar"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ mt: { xs: 2, sm: 0 }, fontWeight: 600 }}
                            >
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
                </Box>
              </Reveal>
            )}

            {/* ── MARCAS ────────────────────────────────────────────────────── */}
            {brands.length > 0 && (
              <Reveal>
                <Box sx={{ py: 6, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Container maxWidth="lg">
                        <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, mb: 3 }}>
                            Marcas Parceiras
                        </Typography>
                        <Box sx={{
                            display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center',
                        }}>
                            {brands.map((brand) => (
                                <Box
                                    key={brand.id}
                                    sx={{
                                        px: 3, py: 1.5,
                                        border: '1px solid', borderColor: 'divider',
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                        color: 'text.secondary',
                                        fontWeight: 700, fontSize: 14,
                                        transition: 'all 0.15s',
                                        cursor: 'default',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            color: 'primary.main',
                                            bgcolor: alpha('#0B5FFF', 0.04),
                                        },
                                    }}
                                >
                                    {brand.name}
                                </Box>
                            ))}
                        </Box>
                    </Container>
                </Box>
              </Reveal>
            )}

            {/* ── APRENDA SOBRE ENERGIA SOLAR (BLOG) ───────────────────────── */}
            {latestPosts.length > 0 && (
                <Reveal>
                    <Box sx={{ py: { xs: 7, md: 9 }, bgcolor: 'white' }}>
                        <Container maxWidth="lg">
                            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 5 }}>
                                <Box>
                                    <Chip label="📚 Conteúdo especializado" sx={{ bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED', fontWeight: 700, mb: 1 }} />
                                    <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                                        Aprenda sobre energia solar
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
                                        Guias e dicas de especialistas para você decidir com mais confiança
                                    </Typography>
                                </Box>
                                <Button component={Link} href="/blog" endIcon={<ArrowForwardIcon />} sx={{ mt: { xs: 2, sm: 0 }, fontWeight: 600 }}>
                                    Ver todos os artigos
                                </Button>
                            </Stack>
                            <Grid container spacing={3}>
                                {latestPosts.map((post) => (
                                    <Grid key={post.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Box
                                            component={Link}
                                            href={`/blog/${post.slug}`}
                                            sx={{
                                                display: 'block', textDecoration: 'none', height: '100%',
                                                borderRadius: 3, overflow: 'hidden',
                                                border: '1px solid rgba(0,0,0,0.06)',
                                                bgcolor: 'white', transition: 'all 0.25s',
                                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' },
                                            }}
                                        >
                                            <Box sx={{
                                                height: 160,
                                                background: post.cover_image
                                                    ? `url(/storage/${post.cover_image}) center/cover`
                                                    : 'linear-gradient(135deg,#0D1B3E,#0B5FFF)',
                                                display: 'flex', alignItems: post.cover_image ? 'flex-end' : 'center', justifyContent: 'center',
                                            }}>
                                                {!post.cover_image && <ArticleIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.5)' }} />}
                                            </Box>
                                            <Box sx={{ p: 2.5 }}>
                                                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                                                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                                        <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                                                            {new Date(post.published_at).toLocaleDateString('pt-BR')}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                                                        · {post.reading_time} min de leitura
                                                    </Typography>
                                                </Stack>
                                                <Typography sx={{ fontWeight: 700, fontSize: 15.5, color: 'text.primary', lineHeight: 1.3, mb: 0.8 }}>
                                                    {post.title}
                                                </Typography>
                                                {post.excerpt && (
                                                    <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.5 }}>
                                                        {post.excerpt}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Container>
                    </Box>
                </Reveal>
            )}

            {/* ── TESTIMONIAIS ──────────────────────────────────────────────── */}
            <Reveal>
              <Box sx={{ py: 8, bgcolor: '#F8F9FC' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Chip label="💬 Avaliações" color="success" size="small" sx={{ mb: 1.5, fontWeight: 600 }} />
                        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                            O que nossos clientes dizem
                        </Typography>
                        <Stack direction="row" spacing={0.3} sx={{ justifyContent: 'center', mt: 1.5 }}>
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} sx={{ color: '#FFB300', fontSize: 20 }} />
                            ))}
                            <Typography sx={{ ml: 1, color: 'text.secondary', fontSize: 14 }}>4,9 de 5 (1.200+ avaliações)</Typography>
                        </Stack>
                    </Box>
                    <Grid container spacing={3}>
                        {TESTIMONIALS.map((t, i) => (
                            <Grid key={i} size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={{
                                    p: 3, borderRadius: 3, height: '100%',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    bgcolor: 'white',
                                    transition: 'all 0.2s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
                                }}>
                                    <FormatQuoteIcon sx={{ fontSize: 36, color: alpha('#0B5FFF', 0.15), mb: 1 }} />
                                    <Typography sx={{ color: 'text.primary', lineHeight: 1.7, mb: 2.5, fontSize: 15 }}>
                                        "{t.text}"
                                    </Typography>
                                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{t.name}</Typography>
                                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{t.city}</Typography>
                                        </Box>
                                        <Stack direction="row" spacing={0.2}>
                                            {[...Array(t.rating)].map((_, j) => (
                                                <StarIcon key={j} sx={{ fontSize: 14, color: '#FFB300' }} />
                                            ))}
                                        </Stack>
                                    </Box>
                                    <Chip label={t.product} size="small" sx={{ mt: 1.5, fontSize: 11, bgcolor: alpha('#0B5FFF', 0.06), color: 'primary.main', fontWeight: 600 }} />
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
              </Box>
            </Reveal>

            {/* ── FAIXA DE CONFIANÇA E SEGURANÇA ───────────────────────────── */}
            <Box sx={{ py: 5, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1.2, mb: 1.5 }}>
                                Formas de pagamento
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                {['Pix', 'Boleto', 'Visa', 'Mastercard', 'Elo', 'Até 12x sem juros'].map((label) => (
                                    <Chip
                                        key={label}
                                        icon={<CreditCardIcon sx={{ fontSize: 16 }} />}
                                        label={label}
                                        size="small"
                                        sx={{ bgcolor: '#F8F9FC', fontWeight: 600, fontSize: 12.5 }}
                                    />
                                ))}
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1.2, mb: 1.5 }}>
                                Sua compra protegida
                            </Typography>
                            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
                                {[
                                    { icon: <GppGoodIcon />, text: 'Site seguro SSL' },
                                    { icon: <LockIcon />, text: 'Pagamento criptografado' },
                                    { icon: <VerifiedIcon />, text: 'Produtos com garantia oficial' },
                                    { icon: <SecurityIcon />, text: 'Dados protegidos (LGPD)' },
                                ].map((item) => (
                                    <Stack key={item.text} direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                                        <Box sx={{ color: 'success.main', display: 'flex' }}>{item.icon}</Box>
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>{item.text}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0D1B3E 0%, #0B3D91 50%, #0B5FFF 100%)',
                py: { xs: 8, md: 12 },
                mb: -8,
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{
                    position: 'absolute', inset: 0, opacity: 0.06,
                    backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.8) 0%, transparent 60%)',
                }} />
                <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ color: 'white', fontWeight: 900, mb: 2, fontSize: { xs: '2rem', md: '3rem' }, letterSpacing: '-1px' }}>
                        Pronto para economizar<br />na conta de luz?
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, mb: 5, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
                        Simule agora mesmo quanto você vai economizar com energia solar. Resultado em segundos, sem compromisso.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
                        <Button
                            component={Link}
                            href="/simulador"
                            size="large"
                            variant="contained"
                            startIcon={<BoltIcon />}
                            sx={{
                                bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 800,
                                px: 5, py: 1.8, fontSize: 17, borderRadius: 2,
                                boxShadow: '0 8px 24px rgba(255,179,0,0.4)',
                                '&:hover': { bgcolor: '#e6a200' },
                            }}
                        >
                            Simular Agora
                        </Button>
                        <Button
                            component={Link}
                            href="/categorias/kits-fotovoltaicos"
                            size="large"
                            variant="outlined"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                borderColor: 'rgba(255,255,255,0.4)', color: 'white',
                                px: 5, py: 1.8, fontSize: 17, borderRadius: 2,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'white' },
                            }}
                        >
                            Ver Kits Solares
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </StorefrontLayout>
    );
}
