import { Head, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import type { PageProps } from '@inertiajs/react';

interface Props extends PageProps { token: string; email: string }

export default function ResetPassword({ token, email }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', p: 2 }}>
            <Head title="Nova Senha" />
            <Box sx={{ width: '100%', maxWidth: 400 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>Redefinir senha</Typography>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box component="form" onSubmit={(e) => { e.preventDefault(); post('/redefinir-senha'); }}>
                            <Stack spacing={2.5}>
                                <TextField label="E-mail" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={!!errors.email} helperText={errors.email} fullWidth />
                                <TextField label="Nova senha" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} error={!!errors.password} helperText={errors.password} fullWidth />
                                <TextField label="Confirmar senha" type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} error={!!errors.password_confirmation} helperText={errors.password_confirmation} fullWidth />
                                <Button type="submit" variant="contained" size="large" fullWidth disabled={processing} sx={{ py: 1.5, fontWeight: 700 }}>
                                    {processing ? 'Salvando...' : 'Salvar nova senha'}
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
