import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Grid, Paper, Stack, Button, Chip,
    Stepper, Step, StepLabel, Avatar, Divider, CircularProgress,
    Alert, LinearProgress, alpha, StepConnector,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BoltIcon from '@mui/icons-material/Bolt';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface KBProduct {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price_cents: number;
    has_discount: boolean;
    brand_name: string | null;
    cover_image: string | null;
    specifications: Record<string, string> | null;
}

interface Props extends PageProps { panels: KBProduct[] }

const STEPS = [
    { label: 'Painel Solar', icon: <SolarPowerIcon />, desc: 'Escolha o módulo fotovoltaico' },
    { label: 'Inversor', icon: <BoltIcon />, desc: 'Selecione o inversor compatível' },
    { label: 'Estrutura & Cabos', icon: <HomeRepairServiceIcon />, desc: 'Acessórios para instalação' },
    { label: 'Resumo', icon: <ShoppingCartIcon />, desc: 'Revise e adicione ao carrinho' },
];

function ProductCard({ product, selected, onSelect }: { product: KBProduct; selected: boolean; onSelect: () => void }) {
    return (
        <Paper
            onClick={onSelect}
            elevation={0}
            sx={{
                p: 2, cursor: 'pointer', position: 'relative',
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'rgba(0,0,0,0.07)',
                borderRadius: 3,
                bgcolor: selected ? alpha('#0B5FFF', 0.03) : 'white',
                transition: 'all 0.18s',
                '&:hover': { borderColor: 'primary.light', transform: 'translateY(-2px)', boxShadow: 4 },
            }}
        >
            {selected && (
                <CheckCircleIcon sx={{
                    position: 'absolute', top: 10, right: 10,
                    color: 'primary.main', fontSize: 24,
                }} />
            )}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Avatar
                    src={product.cover_image ?? undefined}
                    variant="rounded"
                    sx={{ width: 64, height: 64, bgcolor: '#F8F9FA', flexShrink: 0, '& img': { objectFit: 'contain', p: 0.5 } }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {product.brand_name && (
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {product.brand_name}
                        </Typography>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, mb: 0.5 }}>
                        {product.name}
                    </Typography>
                    {product.specifications && Object.entries(product.specifications).slice(0, 2).map(([k, v]) => (
                        <Typography key={k} variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11 }}>
                            {k}: <b>{v}</b>
                        </Typography>
                    ))}
                    <Typography sx={{ fontWeight: 900, color: 'primary.main', fontSize: 16, mt: 0.5 }}>
                        {formatBRL(product.price_cents)}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}

export default function KitBuilder({ panels }: Props) {
    const [step, setStep]           = useState(0);
    const [panel, setPanel]         = useState<KBProduct | null>(null);
    const [inverter, setInverter]   = useState<KBProduct | null>(null);
    const [estrutura, setEstrutura] = useState<KBProduct | null>(null);
    const [cabo, setCabo]           = useState<KBProduct | null>(null);
    const [inverters, setInverters] = useState<KBProduct[]>([]);
    const [estruturas, setEstruturas] = useState<KBProduct[]>([]);
    const [cabos, setCabos]         = useState<KBProduct[]>([]);
    const [loading, setLoading]     = useState(false);

    useEffect(() => {
        if (step === 1 && panel) {
            setLoading(true);
            fetch(`/api/kit-builder/inverters?panel_id=${panel.id}`)
                .then(r => r.json())
                .then(d => { setInverters(d.inverters ?? []); })
                .finally(() => setLoading(false));
        }
        if (step === 2) {
            setLoading(true);
            fetch('/api/kit-builder/accessories')
                .then(r => r.json())
                .then(d => { setEstruturas(d.estruturas ?? []); setCabos(d.cabos ?? []); })
                .finally(() => setLoading(false));
        }
    }, [step, panel]);

    const canNext = () => {
        if (step === 0) return !!panel;
        if (step === 1) return !!inverter;
        if (step === 2) return !!estrutura;
        return true;
    };

    const totalCents = [panel, inverter, estrutura, cabo]
        .filter(Boolean)
        .reduce((sum, p) => sum + (p?.price_cents ?? 0), 0);

    const addAllToCart = () => {
        const items = [panel, inverter, estrutura, cabo].filter(Boolean) as KBProduct[];
        items.forEach(p => {
            router.post('/carrinho/items', { product_id: p.id, quantity: 1 }, { preserveScroll: true, preserveState: true });
        });
    };

    const selectedItems = [panel, inverter, estrutura, cabo].filter(Boolean) as KBProduct[];

    return (
        <StorefrontLayout>
            <Head title="Monte Seu Kit Solar — SolarHub Commerce" />

            <Box sx={{
                background: 'linear-gradient(135deg, #0D1B3E 0%, #0B5FFF 100%)',
                py: { xs: 5, md: 7 }, mb: 4,
            }}>
                <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                    <SolarPowerIcon sx={{ fontSize: 52, color: '#FFB300', mb: 1.5 }} />
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 1, letterSpacing: '-1px' }}>
                        Monte seu Kit Solar
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, maxWidth: 500, mx: 'auto' }}>
                        Passo a passo para montar o sistema solar ideal para o seu consumo
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ pb: 8 }}>
                {/* Stepper */}
                <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3 }}>
                    <Stepper activeStep={step} alternativeLabel>
                        {STEPS.map((s, i) => (
                            <Step key={s.label} completed={i < step}>
                                <StepLabel
                                    StepIconComponent={() => (
                                        <Box sx={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            bgcolor: i < step ? 'success.main' : i === step ? 'primary.main' : 'grey.200',
                                            color: i <= step ? 'white' : 'text.disabled',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.3s',
                                        }}>
                                            {i < step ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : s.icon}
                                        </Box>
                                    )}
                                >
                                    <Typography sx={{ fontWeight: i === step ? 700 : 400, fontSize: 13 }}>{s.label}</Typography>
                                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{s.desc}</Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Paper>

                <Grid container spacing={3}>
                    {/* Coluna principal */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

                        {/* Step 0: Painéis */}
                        {step === 0 && (
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>☀️ Escolha o Painel Solar</Typography>
                                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                                    Selecione o módulo fotovoltaico de acordo com o espaço e consumo
                                </Typography>
                                <Grid container spacing={2}>
                                    {panels.map(p => (
                                        <Grid key={p.id} size={{ xs: 12, sm: 6 }}>
                                            <ProductCard product={p} selected={panel?.id === p.id} onSelect={() => setPanel(p)} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Step 1: Inversores */}
                        {step === 1 && (
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>⚡ Escolha o Inversor</Typography>
                                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                                    Inversores compatíveis com o painel selecionado
                                </Typography>
                                {inverters.length === 0 && !loading && (
                                    <Alert severity="info">Carregando inversores compatíveis...</Alert>
                                )}
                                <Grid container spacing={2}>
                                    {inverters.map(p => (
                                        <Grid key={p.id} size={{ xs: 12, sm: 6 }}>
                                            <ProductCard product={p} selected={inverter?.id === p.id} onSelect={() => setInverter(p)} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Step 2: Estrutura e Cabos */}
                        {step === 2 && (
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>🏗️ Estrutura de Fixação</Typography>
                                <Typography sx={{ color: 'text.secondary', mb: 2 }}>Escolha a estrutura adequada para o tipo de telhado</Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {estruturas.map(p => (
                                        <Grid key={p.id} size={{ xs: 12, sm: 6 }}>
                                            <ProductCard product={p} selected={estrutura?.id === p.id} onSelect={() => setEstrutura(p)} />
                                        </Grid>
                                    ))}
                                </Grid>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>🔌 Cabos e Conectores (opcional)</Typography>
                                <Grid container spacing={2}>
                                    {cabos.map(p => (
                                        <Grid key={p.id} size={{ xs: 12, sm: 6 }}>
                                            <ProductCard product={p} selected={cabo?.id === p.id} onSelect={() => setCabo(cabo?.id === p.id ? null : p)} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Step 3: Resumo */}
                        {step === 3 && (
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>📋 Resumo do Kit</Typography>
                                <Stack spacing={2}>
                                    {selectedItems.map(p => (
                                        <Paper key={p.id} elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 2 }}>
                                            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                                <Avatar src={p.cover_image ?? undefined} variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#F8F9FA', '& img': { objectFit: 'contain' } }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.brand_name} • {p.sku}</Typography>
                                                </Box>
                                                <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: 16 }}>
                                                    {formatBRL(p.price_cents)}
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>

                                <Alert severity="success" sx={{ mt: 3 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        ✅ Kit completo! Todos os componentes selecionados são compatíveis entre si.
                                    </Typography>
                                </Alert>

                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={<ShoppingCartIcon />}
                                    onClick={addAllToCart}
                                    sx={{ mt: 3, py: 1.8, fontWeight: 800, fontSize: 17 }}
                                >
                                    Adicionar Kit Completo ao Carrinho
                                </Button>
                            </Box>
                        )}

                        {/* Navigation */}
                        <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => setStep(s => Math.max(0, s - 1))}
                                disabled={step === 0}
                            >
                                Voltar
                            </Button>
                            {step < 3 && (
                                <Button
                                    variant="contained"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => setStep(s => Math.min(3, s + 1))}
                                    disabled={!canNext()}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {step === 2 ? 'Ver Resumo' : 'Próximo'}
                                </Button>
                            )}
                        </Stack>
                    </Grid>

                    {/* Sidebar — Kit em andamento */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, position: 'sticky', top: 80 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>🧩 Seu Kit em andamento</Typography>
                            <Stack spacing={1.5}>
                                {[
                                    { label: 'Painel', item: panel, icon: '☀️' },
                                    { label: 'Inversor', item: inverter, icon: '⚡' },
                                    { label: 'Estrutura', item: estrutura, icon: '🏗️' },
                                    { label: 'Cabos', item: cabo, icon: '🔌' },
                                ].map(({ label, item, icon }) => (
                                    <Stack key={label} direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                                        <Typography sx={{ fontSize: 18, flexShrink: 0 }}>{icon}</Typography>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{label}</Typography>
                                            {item ? (
                                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }} noWrap>{item.name}</Typography>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: 12 }}>Não selecionado</Typography>
                                            )}
                                        </Box>
                                        {item && (
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', flexShrink: 0, fontSize: 12 }}>
                                                {formatBRL(item.price_cents)}
                                            </Typography>
                                        )}
                                    </Stack>
                                ))}
                            </Stack>

                            {totalCents > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total do kit</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                            {formatBRL(totalCents)}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        ou 12x de {formatBRL(Math.ceil(totalCents / 12))} sem juros
                                    </Typography>
                                </>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </StorefrontLayout>
    );
}
