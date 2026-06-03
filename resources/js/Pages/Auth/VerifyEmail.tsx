import { Head, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Stack, Typography, Alert } from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import type { PageProps } from '@inertiajs/react';

interface Props extends PageProps { status?: string }

export default function VerifyEmail({ status }: Props) {
    const { post, processing } = useForm({});

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', p: 2 }}>
            <Head title="Verificar E-mail" />
            <Box sx={{ width: '100%', maxWidth: 480 }}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
                            <MarkEmailReadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Verifique seu e-mail</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Enviamos um link de verificação para o seu e-mail. Por favor, acesse sua caixa de entrada e clique no link para ativar sua conta.
                            </Typography>
                            {status === 'verification-link-sent' && (
                                <Alert severity="success" sx={{ width: '100%' }}>
                                    Um novo link de verificação foi enviado para o seu e-mail.
                                </Alert>
                            )}
                            <Button
                                onClick={() => post('/verify-email/resend')}
                                disabled={processing}
                                variant="outlined"
                                fullWidth
                            >
                                {processing ? 'Enviando...' : 'Reenviar e-mail de verificação'}
                            </Button>
                            <Button
                                onClick={() => post('/logout')}
                                variant="text"
                                color="inherit"
                                sx={{ color: 'text.secondary' }}
                            >
                                Sair da conta
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
