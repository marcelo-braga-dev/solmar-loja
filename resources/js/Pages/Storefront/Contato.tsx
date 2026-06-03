import { Head, useForm } from '@inertiajs/react';
import {
    Alert, Box, Button, Card, CardContent, Container, Grid,
    Stack, TextField, Typography,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { PageProps } from '@inertiajs/react';

interface Props extends PageProps {
    success?: boolean;
}

export default function Contato({ success }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contato', { onSuccess: () => reset() });
    };

    const CONTATOS = [
        { icon: <WhatsAppIcon sx={{ color: '#25D366' }} />, label: 'WhatsApp', valor: '(11) 99999-9999', href: 'https://wa.me/5511999999999' },
        { icon: <PhoneIcon sx={{ color: 'primary.main' }} />, label: 'Telefone', valor: '(11) 3000-0000', href: 'tel:+551130000000' },
        { icon: <EmailIcon sx={{ color: 'primary.main' }} />, label: 'E-mail', valor: 'contato@solarhub.com.br', href: 'mailto:contato@solarhub.com.br' },
        { icon: <LocationOnIcon sx={{ color: 'error.main' }} />, label: 'Endereço', valor: 'São Paulo, SP — Brasil', href: null },
    ];

    return (
        <StorefrontLayout>
            <Head title="Contato — SolarHub" />

            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Entre em contato</Typography>
                    <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 400 }}>
                        Nossa equipe técnica está pronta para ajudar você.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Grid container spacing={5}>
                    {/* Formulário */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Envie uma mensagem</Typography>

                        {success && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Mensagem enviada com sucesso! Responderemos em até 1 dia útil.
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Nome completo"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            error={!!errors.name}
                                            helperText={errors.name}
                                            fullWidth required
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="E-mail"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={!!errors.email}
                                            helperText={errors.email}
                                            fullWidth required
                                        />
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Telefone / WhatsApp"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Assunto"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            error={!!errors.subject}
                                            helperText={errors.subject}
                                            fullWidth required
                                        />
                                    </Grid>
                                </Grid>
                                <TextField
                                    label="Mensagem"
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    error={!!errors.message}
                                    helperText={errors.message}
                                    multiline
                                    rows={5}
                                    fullWidth required
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={processing}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {processing ? 'Enviando...' : 'Enviar mensagem'}
                                </Button>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* Informações */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Nossos canais</Typography>
                        <Stack spacing={2}>
                            {CONTATOS.map((c) => (
                                <Card key={c.label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                            <Box>{c.icon}</Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{c.label}</Typography>
                                                {c.href ? (
                                                    <Box component="a" href={c.href} sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                                        {c.valor}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.valor}</Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>

                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 3, bgcolor: 'primary.50' }}>
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                                    Horário de atendimento
                                </Typography>
                                <Typography variant="body2">Segunda a Sexta: 8h às 18h</Typography>
                                <Typography variant="body2">Sábado: 8h às 13h</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </StorefrontLayout>
    );
}
