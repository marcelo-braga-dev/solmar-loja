import { Head, Link, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, Alert } from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import type { PageProps } from '@inertiajs/react';

interface Props extends PageProps { status?: string }

export default function ForgotPassword({ status }: Props) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', p: 2 }}>
            <Head title="Recuperar Senha" />
            <Box sx={{ width: '100%', maxWidth: 400 }}>
                <Stack sx={{ alignItems: 'center', mb: 3 }}>
                    <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', mb: 2 }}>
                        <SolarPowerIcon sx={{ color: 'secondary.main', fontSize: 36 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>SolarHub</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Recuperar senha</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                        Informe seu e-mail e enviaremos um link para redefinir sua senha.
                    </Typography>
                </Stack>
                {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box component="form" onSubmit={(e) => { e.preventDefault(); post('/esqueci-minha-senha'); }}>
                            <Stack spacing={2.5}>
                                <TextField label="E-mail" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={!!errors.email} helperText={errors.email} fullWidth autoFocus />
                                <Button type="submit" variant="contained" size="large" fullWidth disabled={processing} sx={{ py: 1.5, fontWeight: 700 }}>
                                    {processing ? 'Enviando...' : 'Enviar link de recuperação'}
                                </Button>
                                <Button component={Link} href="/login" variant="text" fullWidth>Voltar para o login</Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
