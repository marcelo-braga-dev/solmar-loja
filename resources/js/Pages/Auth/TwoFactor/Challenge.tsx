import { Head, useForm } from '@inertiajs/react';
import {
    Box, Button, Card, CardContent, Stack, TextField, Typography, Alert, Tabs, Tab,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useState } from 'react';

export default function TwoFactorChallenge() {
    const [tab, setTab] = useState(0);

    const { data, setData, post, processing, errors } = useForm({ code: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/two-factor/challenge', { onError: () => setData('code', '') });
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', p: 2 }}>
            <Head title="Verificação em Dois Fatores" />

            <Box sx={{ width: '100%', maxWidth: 420 }}>
                <Stack sx={{ alignItems: 'center', mb: 3 }}>
                    <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Verificação em Dois Fatores</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                        Confirme o acesso ao painel administrativo.
                    </Typography>
                </Stack>

                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => { setTab(v); setData('code', ''); }} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Tab label="Código do app" />
                        <Tab label="Código de recuperação" />
                    </Tabs>
                    <CardContent sx={{ p: 4 }}>
                        {errors.code && <Alert severity="error" sx={{ mb: 2 }}>{errors.code}</Alert>}

                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {tab === 0 ? (
                                    <TextField
                                        label="Código de 6 dígitos"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                                        fullWidth
                                        autoFocus
                                        helperText="Digite o código gerado pelo seu aplicativo autenticador."
                                    />
                                ) : (
                                    <TextField
                                        label="Código de recuperação"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        fullWidth
                                        autoFocus
                                        helperText="Use um dos códigos de recuperação gerados ao ativar o 2FA."
                                    />
                                )}

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={processing || data.code.length < 6}
                                    sx={{ py: 1.5, fontWeight: 700 }}
                                >
                                    {processing ? 'Verificando...' : 'Confirmar acesso'}
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
