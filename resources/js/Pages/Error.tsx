import { Head, Link, usePage } from '@inertiajs/react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { SharedProps } from '@/Types/inertia';

interface Props {
    status: number;
    message?: string;
}

const ERROR_CONTENT: Record<number, { title: string; description: string; emoji: string }> = {
    404: {
        emoji: '🔍',
        title: 'Página não encontrada',
        description: 'A página que você está procurando não existe ou foi movida. Verifique o endereço e tente novamente.',
    },
    403: {
        emoji: '🔒',
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página. Faça login com uma conta com acesso adequado.',
    },
    500: {
        emoji: '⚡',
        title: 'Erro interno do servidor',
        description: 'Algo deu errado no servidor. Nossa equipe foi notificada. Tente novamente em alguns instantes.',
    },
    503: {
        emoji: '🔧',
        title: 'Em manutenção',
        description: 'A loja está temporariamente indisponível para manutenção. Voltaremos em breve!',
    },
};

export default function Error({ status, message }: Props) {
    const { branding } = usePage<SharedProps>().props;
    const storeName = branding?.store_name || 'Minha Loja';
    const content = ERROR_CONTENT[status] ?? {
        emoji: '❌',
        title: `Erro ${status}`,
        description: message ?? 'Ocorreu um erro inesperado.',
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
            <Head title={`${status} — ${content.title}`} />

            {/* Header simples */}
            <Box sx={{ bgcolor: 'primary.main', py: 2, px: 3 }}>
                <Box component={Link} href="/" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
                    {branding?.logo_url ? (
                        <Box component="img" src={branding.logo_url} alt={storeName} sx={{ height: 32, maxWidth: 160, objectFit: 'contain' }} />
                    ) : (
                        <>
                            <SolarPowerIcon sx={{ color: '#FFB300', fontSize: 28 }} />
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>{storeName}</Typography>
                        </>
                    )}
                </Box>
            </Box>

            <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 8 }}>
                <Stack sx={{ alignItems: 'center', textAlign: 'center', width: '100%' }}>
                    <Typography sx={{ fontSize: 80, lineHeight: 1, mb: 2 }}>{content.emoji}</Typography>

                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: 72, sm: 96 },
                            fontWeight: 900,
                            color: 'primary.main',
                            lineHeight: 1,
                            mb: 1,
                        }}
                    >
                        {status}
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                        {content.title}
                    </Typography>

                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 400 }}>
                        {content.description}
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button
                            component={Link}
                            href="/"
                            variant="contained"
                            size="large"
                            startIcon={<HomeIcon />}
                            sx={{ fontWeight: 700 }}
                        >
                            Ir para o início
                        </Button>
                        <Button
                            onClick={() => window.history.back()}
                            variant="outlined"
                            size="large"
                            startIcon={<ArrowBackIcon />}
                            sx={{ fontWeight: 700 }}
                        >
                            Voltar
                        </Button>
                    </Stack>

                    {status === 404 && (
                        <Box sx={{ mt: 6, p: 3, bgcolor: 'primary.50', borderRadius: 3, width: '100%' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                Talvez você esteja procurando por:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                                {[
                                    { label: 'Produtos', href: '/' },
                                    { label: 'Simulador Solar', href: '/simulador' },
                                    { label: 'Blog', href: '/blog' },
                                    { label: 'Minha conta', href: '/conta' },
                                ].map((link) => (
                                    <Button
                                        key={link.href}
                                        component={Link}
                                        href={link.href}
                                        size="small"
                                        variant="outlined"
                                        sx={{ borderRadius: 8 }}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </Container>

            {/* Footer simples */}
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
                </Typography>
            </Box>
        </Box>
    );
}
