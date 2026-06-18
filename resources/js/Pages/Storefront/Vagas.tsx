import { Head } from '@inertiajs/react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

export default function Vagas() {
    return (
        <StorefrontLayout>
            <Head title="Trabalhe Conosco" />

            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Trabalhe Conosco</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.85 }}>
                        Faça parte do time que está construindo a maior plataforma de energia solar do Brasil.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: 8 }}>
                <Stack spacing={3} sx={{ textAlign: 'center', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, maxWidth: 560 }}>
                        No momento não temos vagas abertas, mas estamos sempre em busca de pessoas talentosas para
                        crescer junto com a gente. Envie seu currículo para nosso e-mail e entraremos em contato
                        quando surgir uma oportunidade alinhada com o seu perfil.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        href="mailto:vagas@solarhub.com.br"
                    >
                        Enviar currículo
                    </Button>
                </Stack>
            </Container>
        </StorefrontLayout>
    );
}
