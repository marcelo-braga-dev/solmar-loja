import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Box, Button, Card, CardContent, Checkbox,
    FormControlLabel, Stack, TextField, Typography,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import type { SharedProps } from '@/Types/inertia';

export default function Register() {
    const { branding } = usePage<SharedProps>().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', p: 2 }}>
            <Head title="Criar Conta" />

            <Box sx={{ width: '100%', maxWidth: 440 }}>
                <Stack sx={{ alignItems: 'center', mb: 3 }}>
                    <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', mb: 2 }}>
                        {branding?.logo_url ? (
                            <Box component="img" src={branding.logo_url} alt={branding.store_name} sx={{ height: 40, maxWidth: 180, objectFit: 'contain' }} />
                        ) : (
                            <>
                                <SolarPowerIcon sx={{ color: 'secondary.main', fontSize: 36 }} />
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>{branding?.store_name || 'Minha Loja'}</Typography>
                            </>
                        )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Criar conta gratuita</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Já tem conta?{' '}
                        <Box component={Link} href="/login" sx={{ color: 'primary.main', fontWeight: 600 }}>Entrar</Box>
                    </Typography>
                </Stack>

                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <TextField
                                    label="Nome completo"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    fullWidth autoFocus autoComplete="name"
                                />
                                <TextField
                                    label="E-mail"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    fullWidth autoComplete="email"
                                />
                                <TextField
                                    label="Senha"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={!!errors.password}
                                    helperText={errors.password ?? 'Mínimo 8 caracteres'}
                                    fullWidth autoComplete="new-password"
                                />
                                <TextField
                                    label="Confirmar senha"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={!!errors.password_confirmation}
                                    helperText={errors.password_confirmation}
                                    fullWidth autoComplete="new-password"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={data.terms}
                                            onChange={(e) => setData('terms', e.target.checked)}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Aceito os{' '}
                                            <Box component={Link} href="/termos" sx={{ color: 'primary.main' }}>Termos de Uso</Box>
                                            {' '}e a{' '}
                                            <Box component={Link} href="/privacidade" sx={{ color: 'primary.main' }}>Política de Privacidade</Box>
                                        </Typography>
                                    }
                                />
                                {errors.terms && <Typography variant="caption" color="error">{errors.terms}</Typography>}

                                <Button type="submit" variant="contained" size="large" fullWidth disabled={processing} sx={{ py: 1.5, fontWeight: 700 }}>
                                    {processing ? 'Criando conta...' : 'Criar minha conta'}
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
