import { Head, useForm } from '@inertiajs/react';
import {
    Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
    DialogTitle, Divider, Grid, Stack, TextField, Typography,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';

interface Props extends PageProps {
    enabled: boolean;
    secret: string | null;
    qrCode: string | null;
    recoveryCodes: string[];
}

export default function TwoFactorSetup({ enabled, secret, qrCode, recoveryCodes }: Props) {
    const [disableOpen, setDisableOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const enableForm = useForm({ code: '' });
    const disableForm = useForm({ password: '' });

    const handleEnable = (e: React.FormEvent) => {
        e.preventDefault();
        enableForm.post('/two-factor/enable', {
            onError: () => enableForm.setData('code', ''),
        });
    };

    const handleDisable = (e: React.FormEvent) => {
        e.preventDefault();
        disableForm.post('/two-factor/disable', {
            onSuccess: () => setDisableOpen(false),
        });
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <AdminLayout>
            <Head title="Autenticação em Dois Fatores" />

            <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 4 }}>
                    <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Autenticação em Dois Fatores</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Adicione uma camada extra de segurança ao painel administrativo.
                        </Typography>
                    </Box>
                    <Chip
                        label={enabled ? 'Ativo' : 'Inativo'}
                        color={enabled ? 'success' : 'default'}
                        icon={enabled ? <CheckCircleIcon /> : undefined}
                        sx={{ ml: 'auto' }}
                    />
                </Stack>

                {enabled ? (
                    <Stack spacing={3}>
                        <Alert severity="success">
                            O 2FA está ativo. Você precisará informar o código do aplicativo toda vez que acessar o painel.
                        </Alert>

                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                    Códigos de recuperação
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez.
                                </Typography>
                                <Grid container spacing={1}>
                                    {recoveryCodes.map((code) => (
                                        <Grid key={code} size={{ xs: 12, sm: 6 }}>
                                            <Box
                                                onClick={() => copyCode(code)}
                                                sx={{
                                                    fontFamily: 'monospace', fontSize: 13, p: 1, borderRadius: 1,
                                                    bgcolor: 'grey.100', cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'space-between',
                                                    '&:hover': { bgcolor: 'grey.200' },
                                                    color: copiedCode === code ? 'success.main' : 'text.primary',
                                                }}
                                            >
                                                {copiedCode === code ? 'Copiado!' : code}
                                                <ContentCopyIcon sx={{ fontSize: 14, ml: 1 }} />
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => setDisableOpen(true)}
                                >
                                    Desativar 2FA
                                </Button>
                            </CardContent>
                        </Card>
                    </Stack>
                ) : (
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                Configurar autenticação em dois fatores
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                Use um aplicativo como <strong>Google Authenticator</strong>, <strong>Authy</strong> ou{' '}
                                <strong>Microsoft Authenticator</strong>.
                            </Typography>

                            {qrCode && (
                                <Stack sx={{ alignItems: 'center', mb: 3 }}>
                                    <Box
                                        dangerouslySetInnerHTML={{ __html: qrCode }}
                                        sx={{ '& svg': { width: 200, height: 200 } }}
                                    />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                                        Ou insira manualmente: <strong>{secret}</strong>
                                    </Typography>
                                </Stack>
                            )}

                            <Box component="form" onSubmit={handleEnable}>
                                <Stack spacing={2}>
                                    {enableForm.errors.code && (
                                        <Alert severity="error">{enableForm.errors.code}</Alert>
                                    )}
                                    <TextField
                                        label="Código de confirmação"
                                        value={enableForm.data.code}
                                        onChange={(e) => enableForm.setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                                        helperText="Digite o código de 6 dígitos do app autenticador."
                                        fullWidth
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={enableForm.processing || enableForm.data.code.length < 6}
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {enableForm.processing ? 'Ativando...' : 'Ativar 2FA'}
                                    </Button>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Dialog de desativação */}
            <Dialog open={disableOpen} onClose={() => setDisableOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Desativar autenticação em dois fatores</DialogTitle>
                <DialogContent>
                    <Box component="form" id="disable-form" onSubmit={handleDisable} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            Confirme sua senha para desativar o 2FA. Isso removerá a proteção extra da sua conta.
                        </Typography>
                        {disableForm.errors.password && (
                            <Alert severity="error" sx={{ mb: 2 }}>{disableForm.errors.password}</Alert>
                        )}
                        <TextField
                            label="Senha atual"
                            type="password"
                            value={disableForm.data.password}
                            onChange={(e) => disableForm.setData('password', e.target.value)}
                            fullWidth
                            autoFocus
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDisableOpen(false)}>Cancelar</Button>
                    <Button
                        form="disable-form"
                        type="submit"
                        color="error"
                        variant="contained"
                        disabled={disableForm.processing}
                    >
                        Desativar
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
