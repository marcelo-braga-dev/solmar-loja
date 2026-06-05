import { Head, Link } from '@inertiajs/react';
import { type ElementType } from 'react';
import { Box, Container, Typography, Button, Grid, Paper, Stack, Chip, Avatar, alpha } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { PageProps } from '@inertiajs/react';

interface UserCompany {
    razao_social: string;
    status: string;
    status_label: string;
    status_color: string;
    price_list: string | null;
}

interface Props extends PageProps { user_company: UserCompany | null }

const BENEFITS = [
    { icon: <LocalOfferIcon sx={{ fontSize: 28 }} />, title: 'Tabela de Preço Exclusiva', desc: 'Acesso à tabela de preços especiais para integradores com descontos a partir de 18%.', color: '#0B5FFF' },
    { icon: <TrendingUpIcon sx={{ fontSize: 28 }} />, title: 'Crédito e Prazo', desc: 'Limite de crédito pré-aprovado e condições de pagamento facilitadas para projetos.', color: '#059669' },
    { icon: <GroupsIcon sx={{ fontSize: 28 }} />, title: 'Portal de Projetos', desc: 'Gerencie todas as suas obras e projetos em um único lugar com histórico completo.', color: '#7C3AED' },
    { icon: <VerifiedIcon sx={{ fontSize: 28 }} />, title: 'Suporte Prioritário', desc: 'Atendimento dedicado para integradores com consultores especializados.', color: '#EA580C' },
];

const TYPES = [
    { type: 'Integrador Solar', desc: 'Empresas que instalam e mantêm sistemas fotovoltaicos' },
    { type: 'Engenharia Solar', desc: 'Projetistas e engenheiros especializados em energia solar' },
    { type: 'Revendedor', desc: 'Lojas e empresas que revendem equipamentos fotovoltaicos' },
    { type: 'Distribuidor', desc: 'Distribuidores regionais de equipamentos solares' },
];

export default function B2bLanding({ user_company }: Props) {
    return (
        <StorefrontLayout>
            <Head title="Portal B2B — SolarHub Commerce" />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #0B3D91 40%, #0B5FFF 100%)', py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                <Container maxWidth="lg" sx={{ position: 'relative', textAlign: 'center' }}>
                    <Chip label="Portal B2B — Integradores & Distribuidores" sx={{ bgcolor: 'rgba(255,179,0,0.18)', color: '#FFD54F', fontWeight: 600, mb: 3, fontSize: 12, border: '1px solid rgba(255,179,0,0.25)' }} />
                    <Typography variant="h2" sx={{ color: 'white', fontWeight: 900, mb: 2, fontSize: { xs: '2.2rem', md: '3.2rem' }, letterSpacing: '-1px', lineHeight: 1.05 }}>
                        Condições especiais para<br />
                        <Box component="span" sx={{ background: 'linear-gradient(90deg,#FFB300,#FFD54F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            quem vive de solar
                        </Box>
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, mb: 5, maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>
                        Cadastre sua empresa e tenha acesso a tabelas de preço exclusivas, crédito, suporte prioritário e muito mais.
                    </Typography>

                    {user_company ? (
                        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Paper sx={{ px: 3, py: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                    <BusinessIcon sx={{ color: '#FFB300', fontSize: 28 }} />
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{user_company.razao_social}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                            <Chip label={user_company.status_label} size="small" color={user_company.status === 'active' ? 'success' : 'warning'} sx={{ fontWeight: 700, fontSize: 11 }} />
                                            {user_company.price_list && <Chip label={user_company.price_list} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Paper>
                            <Button component={Link as ElementType} href="/portal-b2b/dashboard" variant="contained" size="large" startIcon={<ArrowForwardIcon />} sx={{ bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 800, px: 4, '&:hover': { bgcolor: '#e6a200' } }}>
                                Ir para meu Portal
                            </Button>
                        </Box>
                    ) : (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
                            <Button component={Link as ElementType} href="/portal-b2b/cadastrar" variant="contained" size="large" startIcon={<BusinessIcon />} sx={{ bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 800, px: 5, py: 1.8, fontSize: 17, '&:hover': { bgcolor: '#e6a200' } }}>
                                Cadastrar minha empresa
                            </Button>
                            <Button component={Link as ElementType} href="/login" variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', px: 5, py: 1.8, fontSize: 17, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'white' } }}>
                                Já sou cadastrado
                            </Button>
                        </Stack>
                    )}
                </Container>
            </Box>

            {/* Benefícios */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>Por que ser parceiro B2B?</Typography>
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', mb: 6 }}>Vantagens exclusivas para quem faz parte do ecossistema SolarHub</Typography>
                <Grid container spacing={3}>
                    {BENEFITS.map((b) => (
                        <Grid key={b.title} size={{ xs: 12, sm: 6 }}>
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${alpha(b.color, 0.12)}`, borderColor: alpha(b.color, 0.3) } }}>
                                <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: alpha(b.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.color, mb: 2 }}>
                                    {b.icon}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{b.title}</Typography>
                                <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>{b.desc}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Quem pode se cadastrar */}
            <Box sx={{ bgcolor: '#F8F9FC', py: 8 }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>Quem pode participar?</Typography>
                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', mb: 6 }}>O portal B2B é exclusivo para empresas do setor de energia solar</Typography>
                    <Grid container spacing={2.5}>
                        {TYPES.map((t) => (
                            <Grid key={t.type} size={{ xs: 12, sm: 6, md: 3 }}>
                                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, textAlign: 'center', height: '100%' }}>
                                    <CheckCircleIcon sx={{ fontSize: 32, color: '#059669', mb: 1.5 }} />
                                    <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{t.type}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.desc}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA final */}
            {!user_company && (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Container maxWidth="sm">
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Pronto para começar?</Typography>
                        <Typography sx={{ color: 'text.secondary', mb: 4 }}>Cadastro gratuito. Nossa equipe analisa em até 1 dia útil.</Typography>
                        <Button component={Link as ElementType} href="/portal-b2b/cadastrar" variant="contained" size="large" startIcon={<BusinessIcon />} sx={{ px: 5, py: 1.8, fontWeight: 800, fontSize: 17 }}>
                            Cadastrar minha empresa agora
                        </Button>
                    </Container>
                </Box>
            )}
        </StorefrontLayout>
    );
}
