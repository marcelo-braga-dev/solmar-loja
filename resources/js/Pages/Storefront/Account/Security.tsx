import { Head, Link, useForm } from '@inertiajs/react';
import {
    Box, Button, Chip, Divider, Paper, Stack, TextField, Typography, Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import type { PageProps } from '@inertiajs/react';
import AccountLayout from '@/Layouts/AccountLayout';

interface Props extends PageProps {
    user: { id: number; name: string; email: string; email_verified_at: string | null };
    is_admin: boolean;
    has_2fa: boolean;
}

export default function Security({ user, is_admin, has_2fa }: Props) {
    const { data, setData, put, processing, errors, reset, wasSuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/conta/senha', { onSuccess: () => reset() });
    };

    return (
        <AccountLayout title="Segurança">
            <Head title="Segurança da Conta" />

            <Stack spacing={3}>
                {/* Status da conta */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2.5 }}>
                        <VerifiedUserIcon color="primary" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Status da Conta</Typography>
                    </Stack>

                    <Stack spacing={2}>
                        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                                    <MarkEmailReadIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>E-mail</Typography>
                                </Stack>
                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 3.5 }}>{user.email}</Typography>
                            </Box>
                            {user.email_verified_at ? (
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Verificado"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                />
                            ) : (
                                <Chip label="Não verificado" color="warning" size="small" variant="outlined" />
                            )}
                        </Stack>

                        <Divider />

                        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                                    <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Senha</Typography>
                                </Stack>
                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 3.5 }}>
                                    Use uma senha forte com pelo menos 8 caracteres
                                </Typography>
                            </Box>
                            <Chip label="Configurada" color="success" size="small" variant="outlined" icon={<CheckCircleIcon />} />
                        </Stack>

                        {is_admin && (
                            <>
                                <Divider />
                                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                    <Box>
                                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                                            <SecurityIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Autenticação em Duas Etapas (2FA)</Typography>
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 3.5 }}>
                                            Adiciona uma camada extra de proteção ao painel admin
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                                        <Chip
                                            label={has_2fa ? 'Ativo' : 'Inativo'}
                                            color={has_2fa ? 'success' : 'default'}
                                            size="small"
                                            variant="outlined"
                                            icon={has_2fa ? <CheckCircleIcon /> : undefined}
                                        />
                                        <Button
                                            component={Link}
                                            href="/two-factor/setup"
                                            size="small"
                                            variant={has_2fa ? 'outlined' : 'contained'}
                                            color={has_2fa ? 'inherit' : 'primary'}
                                        >
                                            {has_2fa ? 'Gerenciar' : 'Ativar 2FA'}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Paper>

                {/* Alterar senha */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2.5 }}>
                        <LockIcon color="primary" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Alterar Senha</Typography>
                    </Stack>

                    {wasSuccessful && (
                        <Alert severity="success" sx={{ mb: 2 }}>Senha alterada com sucesso!</Alert>
                    )}

                    <Box component="form" onSubmit={handlePasswordSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                label="Senha atual"
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                error={!!errors.current_password}
                                helperText={errors.current_password}
                                fullWidth
                                autoComplete="current-password"
                            />
                            <TextField
                                label="Nova senha"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={!!errors.password}
                                helperText={errors.password ?? 'Mínimo 8 caracteres'}
                                fullWidth
                                autoComplete="new-password"
                            />
                            <TextField
                                label="Confirmar nova senha"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                error={!!errors.password_confirmation}
                                helperText={errors.password_confirmation}
                                fullWidth
                                autoComplete="new-password"
                            />
                        </Stack>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" disabled={processing}>
                                {processing ? 'Salvando...' : 'Alterar senha'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Dicas de segurança */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Dicas de segurança</Typography>
                    <Stack spacing={1}>
                        {[
                            'Use uma senha com letras maiúsculas, minúsculas, números e símbolos.',
                            'Nunca compartilhe sua senha com terceiros.',
                            'Evite usar a mesma senha em outros sites.',
                            'Em caso de suspeita de acesso não autorizado, altere sua senha imediatamente.',
                        ].map((tip, i) => (
                            <Stack key={i} direction="row" sx={{ gap: 1, alignItems: 'flex-start' }}>
                                <Typography sx={{ color: 'primary.main', fontSize: 16, lineHeight: 1.5 }}>•</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{tip}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Paper>
            </Stack>
        </AccountLayout>
    );
}
