import { Head, Link, useForm } from '@inertiajs/react';
import {
    Box, Button, Card, CardContent, Checkbox, Divider,
    FormControlLabel, Stack, TextField, Typography, Alert,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import type { PageProps } from '@inertiajs/react';

interface Props extends PageProps {
    canResetPassword: boolean;
    status?: string;
}

export default function Login({ canResetPassword, status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', p: 2 }}>
            <Head title="Entrar" />

            <Box sx={{ width: '100%', maxWidth: 420 }}>
                <Stack sx={{ alignItems: 'center', mb: 3 }}>
                    <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', mb: 2 }}>
                        <SolarPowerIcon sx={{ color: 'secondary.main', fontSize: 36 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>SolarHub</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Entrar na sua conta</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Não tem conta?{' '}
                        <Box component={Link} href="/register" sx={{ color: 'primary.main', fontWeight: 600 }}>Cadastre-se grátis</Box>
                    </Typography>
                </Stack>

                {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}

                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <TextField
                                    label="E-mail"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    fullWidth
                                    autoComplete="email"
                                    autoFocus
                                />
                                <TextField
                                    label="Senha"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    fullWidth
                                    autoComplete="current-password"
                                />
                                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />}
                                        label={<Typography variant="body2">Lembrar-me</Typography>}
                                    />
                                    {canResetPassword && (
                                        <Box component={Link} href="/esqueci-minha-senha" sx={{ fontSize: 14, color: 'primary.main', textDecoration: 'none' }}>
                                            Esqueci minha senha
                                        </Box>
                                    )}
                                </Stack>
                                <Button type="submit" variant="contained" size="large" fullWidth disabled={processing} sx={{ py: 1.5, fontWeight: 700 }}>
                                    {processing ? 'Entrando...' : 'Entrar'}
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                <Divider sx={{ my: 3 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>ou continue como</Typography>
                </Divider>

                <Button
                    component={Link}
                    href="/"
                    variant="outlined"
                    fullWidth
                    size="large"
                    sx={{ fontWeight: 600 }}
                >
                    Continuar sem login
                </Button>
            </Box>
        </Box>
    );
}
