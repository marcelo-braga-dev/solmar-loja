import { Head } from '@inertiajs/react';
import {
    Box, Container, Divider, Grid, Stack, Typography, Paper,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

const VALORES = [
    { icon: <VerifiedIcon sx={{ fontSize: 40, color: 'primary.main' }} />, titulo: 'Qualidade garantida', desc: 'Trabalhamos apenas com marcas homologadas pelo INMETRO e com garantia de fábrica.' },
    { icon: <SupportAgentIcon sx={{ fontSize: 40, color: 'primary.main' }} />, titulo: 'Suporte técnico especializado', desc: 'Nossa equipe de engenheiros está disponível para ajudar no dimensionamento e instalação.' },
    { icon: <LocalShippingIcon sx={{ fontSize: 40, color: 'primary.main' }} />, titulo: 'Entrega para todo o Brasil', desc: 'Parcerias com as maiores transportadoras para garantir que seus produtos cheguem com segurança.' },
];

const NUMEROS = [
    { valor: '10.000+', label: 'Clientes atendidos' },
    { valor: '500+', label: 'Produtos disponíveis' },
    { valor: '27', label: 'Estados com entrega' },
    { valor: '5 anos', label: 'De experiência' },
];

export default function Sobre() {
    return (
        <StorefrontLayout>
            <Head title="Sobre nós — SolarHub" />

            {/* Hero */}
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <SolarPowerIcon sx={{ fontSize: 64, color: 'secondary.main' }} />
                    </Box>
                    <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>Sobre o SolarHub</Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
                        Somos a maior plataforma de e-commerce especializada em energia solar e mobilidade elétrica do Brasil.
                    </Typography>
                </Container>
            </Box>

            {/* Missão */}
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}>Nossa missão</Typography>
                <Typography variant="body1" sx={{ fontSize: 18, color: 'text.secondary', lineHeight: 1.8, textAlign: 'center' }}>
                    Democratizar o acesso à energia solar no Brasil, tornando a transição energética acessível,
                    simples e vantajosa para residências, empresas e propriedades rurais. Acreditamos que
                    energia limpa deve ser para todos.
                </Typography>

                <Divider sx={{ my: 6 }} />

                {/* Números */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {NUMEROS.map((n) => (
                        <Grid key={n.label} size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main' }}>{n.valor}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{n.label}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ mb: 6 }} />

                {/* Valores */}
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>Por que escolher o SolarHub?</Typography>
                <Grid container spacing={3}>
                    {VALORES.map((v) => (
                        <Grid key={v.titulo} size={{ xs: 12, md: 4 }}>
                            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', height: '100%' }}>
                                <Box sx={{ mb: 2 }}>{v.icon}</Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{v.titulo}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{v.desc}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 6 }} />

                {/* História */}
                <Stack spacing={3}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Nossa história</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        O SolarHub nasceu da paixão por energia renovável e da frustração com a dificuldade de
                        encontrar produtos de qualidade a preços justos no mercado brasileiro. Fundado por
                        engenheiros eletricistas e especialistas em energia solar, começamos como um pequeno
                        distribuidor regional e crescemos para nos tornar referência nacional no segmento.
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        Hoje, com mais de 10.000 clientes satisfeitos em todos os estados do Brasil, seguimos
                        fiéis ao nosso propósito: ajudar cada brasileiro a dar o primeiro passo rumo à
                        independência energética, com segurança, suporte técnico e os melhores preços do mercado.
                    </Typography>
                </Stack>
            </Container>
        </StorefrontLayout>
    );
}
