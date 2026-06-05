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
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>ou continue com</Typography>
                </Divider>

                {/* Google Login */}
                <Button
                    component="a"
                    href="/auth/google"
                    variant="outlined"
                    fullWidth
                    size="large"
                    sx={{ fontWeight: 600, mb: 2, borderColor: 'divider', color: 'text.primary', '&:hover': { bgcolor: 'grey.50' } }}
                    startIcon={
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                            <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
                        </svg>
                    }
                >
                    Continuar com Google
                </Button>

                <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>ou</Typography>
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
