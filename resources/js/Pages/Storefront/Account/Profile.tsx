import { Head, useForm } from '@inertiajs/react';
import { Box, Button, Grid, Paper, Stack, TextField, Typography, FormHelperText } from '@mui/material';
import type { PageProps } from '@inertiajs/react';
import AccountLayout from '@/Layouts/AccountLayout';
import MaskedTextField from '@/Components/ui/MaskedTextField';
import { maskPhone, maskCpfCnpj, validateCpfCnpj, onlyDigits } from '@/Lib/masks';

interface Props extends PageProps {
    user: { id: number; name: string; email: string };
    customer: { phone?: string; cpf_cnpj?: string; birth_date?: string } | null;
}

export default function Profile({ user, customer }: Props) {
    const profileForm = useForm({
        name:       user.name,
        email:      user.email,
        phone:      customer?.phone ?? '',
        cpf_cnpj:   customer?.cpf_cnpj ?? '',
        birth_date: customer?.birth_date ?? '',
    });

    const passwordForm = useForm({
        current_password:      '',
        password:              '',
        password_confirmation: '',
    });

    const cpfCnpjDigits  = onlyDigits(profileForm.data.cpf_cnpj);
    const cpfCnpjIsValid = cpfCnpjDigits === '' || validateCpfCnpj(profileForm.data.cpf_cnpj);
    const cpfCnpjLabel   = cpfCnpjDigits.length > 11 ? 'CNPJ' : 'CPF / CNPJ';
    const cpfCnpjHelper  = !cpfCnpjIsValid
        ? (cpfCnpjDigits.length === 11 ? 'CPF inválido' : 'CNPJ inválido')
        : (cpfCnpjDigits.length > 0 ? (cpfCnpjDigits.length === 11 ? '✓ CPF válido' : cpfCnpjDigits.length === 14 ? '✓ CNPJ válido' : undefined) : undefined);

    return (
        <AccountLayout title="Meus Dados">
            <Head title="Meus Dados" />

            <Stack spacing={3}>
                {/* Dados pessoais */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Informações pessoais</Typography>
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); profileForm.put('/conta/perfil'); }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Nome completo"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    error={!!profileForm.errors.name}
                                    helperText={profileForm.errors.name}
                                    fullWidth
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="E-mail"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    error={!!profileForm.errors.email}
                                    helperText={profileForm.errors.email}
                                    fullWidth
                                />
                            </Grid>

                            {/* Telefone com máscara automática fixo/celular */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <MaskedTextField
                                    label="Telefone / Celular"
                                    mask={maskPhone}
                                    value={profileForm.data.phone}
                                    onChange={(masked) => profileForm.setData('phone', masked)}
                                    error={!!profileForm.errors.phone}
                                    helperText={profileForm.errors.phone ?? 'Ex.: (11) 99999-9999'}
                                    placeholder="(11) 99999-9999"
                                    fullWidth
                                    slotProps={{ htmlInput: { maxLength: 16 } }}
                                />
                            </Grid>

                            {/* CPF / CNPJ com validação */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <MaskedTextField
                                    label={cpfCnpjLabel}
                                    mask={maskCpfCnpj}
                                    value={profileForm.data.cpf_cnpj}
                                    onChange={(masked) => profileForm.setData('cpf_cnpj', masked)}
                                    error={!!profileForm.errors.cpf_cnpj || !cpfCnpjIsValid}
                                    helperText={
                                        profileForm.errors.cpf_cnpj
                                            ?? (cpfCnpjHelper ? (
                                                <span style={{ color: !cpfCnpjIsValid ? 'inherit' : '#16A34A' }}>
                                                    {cpfCnpjHelper}
                                                </span>
                                            ) : undefined)
                                    }
                                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                                    fullWidth
                                    slotProps={{ htmlInput: { maxLength: 18 } }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Data de nascimento"
                                    type="date"
                                    value={profileForm.data.birth_date}
                                    onChange={(e) => profileForm.setData('birth_date', e.target.value)}
                                    fullWidth
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" disabled={profileForm.processing}>
                                {profileForm.processing ? 'Salvando...' : 'Salvar dados'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Alterar senha */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Alterar senha</Typography>
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); passwordForm.put('/conta/senha', { onSuccess: () => passwordForm.reset() }); }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Senha atual"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                error={!!passwordForm.errors.current_password}
                                helperText={passwordForm.errors.current_password}
                                fullWidth
                                autoComplete="current-password"
                            />
                            <TextField
                                label="Nova senha"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                error={!!passwordForm.errors.password}
                                helperText={passwordForm.errors.password ?? 'Mínimo 8 caracteres'}
                                fullWidth
                                autoComplete="new-password"
                            />
                            <TextField
                                label="Confirmar nova senha"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                error={!!passwordForm.errors.password_confirmation}
                                helperText={passwordForm.errors.password_confirmation}
                                fullWidth
                                autoComplete="new-password"
                            />
                        </Stack>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="outlined" disabled={passwordForm.processing}>
                                {passwordForm.processing ? 'Salvando...' : 'Alterar senha'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Stack>
        </AccountLayout>
    );
}
