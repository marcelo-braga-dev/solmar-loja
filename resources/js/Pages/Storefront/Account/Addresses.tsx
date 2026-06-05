import { Head, useForm, router } from '@inertiajs/react';
import {
    Box, Button, Card, CardContent, CardActions, Grid, Typography, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions as MuiDialogActions,
    TextField, Chip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useState } from 'react';
import AccountLayout from '@/Layouts/AccountLayout';
import CepField from '@/Components/ui/CepField';
import type { PageProps } from '@inertiajs/react';

interface AddressData {
    id: number;
    label?: string;
    recipient: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    is_default_shipping: boolean;
    is_default_billing: boolean;
    full_address: string;
}

interface Props extends PageProps { addresses: AddressData[] }

export default function Addresses({ addresses }: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        label: '',
        recipient: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        is_default_shipping: true,
        is_default_billing: false,
    });

    return (
        <AccountLayout title="Meus Endereços">
            <Head title="Endereços" />

            <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                    Novo Endereço
                </Button>
            </Stack>

            {addresses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <LocationOnIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body1">Nenhum endereço cadastrado.</Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {addresses.map((address) => (
                        <Grid key={address.id} size={{ xs: 12, sm: 6 }}>
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: address.is_default_shipping ? 'primary.main' : 'divider', borderRadius: 2, height: '100%' }}>
                                <CardContent>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {address.label ?? 'Endereço'}
                                        </Typography>
                                        {address.is_default_shipping && <Chip label="Principal" color="primary" size="small" />}
                                    </Stack>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{address.recipient}</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{address.full_address}</Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                    <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => confirm('Remover endereço?') && router.delete(`/conta/enderecos/${address.id}`)}>
                                        Remover
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={open} onClose={() => { setOpen(false); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Endereço</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Apelido (ex: Casa, Trabalho)"
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    fullWidth size="small"
                                    placeholder="Casa"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Destinatário *"
                                    value={data.recipient}
                                    onChange={(e) => setData('recipient', e.target.value)}
                                    error={!!errors.recipient}
                                    helperText={errors.recipient}
                                    fullWidth size="small"
                                />
                            </Grid>

                            {/* CEP com auto-preenchimento */}
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <CepField
                                    value={data.cep}
                                    onChange={(masked) => setData('cep', masked)}
                                    onFill={(info) => setData((prev) => ({
                                        ...prev,
                                        street:   info.logradouro || prev.street,
                                        district: info.bairro     || prev.district,
                                        city:     info.localidade,
                                        state:    info.uf,
                                    }))}
                                    error={errors.cep}
                                    required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    label="Rua / Avenida *"
                                    value={data.street}
                                    onChange={(e) => setData('street', e.target.value)}
                                    error={!!errors.street}
                                    helperText={errors.street}
                                    fullWidth size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Número *"
                                    value={data.number}
                                    onChange={(e) => setData('number', e.target.value)}
                                    error={!!errors.number}
                                    helperText={errors.number}
                                    fullWidth size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    label="Complemento"
                                    value={data.complement}
                                    onChange={(e) => setData('complement', e.target.value)}
                                    fullWidth size="small"
                                    placeholder="Apto, Bloco, etc."
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Bairro *"
                                    value={data.district}
                                    onChange={(e) => setData('district', e.target.value)}
                                    error={!!errors.district}
                                    helperText={errors.district}
                                    fullWidth size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Cidade *"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    error={!!errors.city}
                                    helperText={errors.city}
                                    fullWidth size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 2 }}>
                                <TextField
                                    label="UF *"
                                    value={data.state}
                                    onChange={(e) => setData('state', e.target.value.toUpperCase().slice(0, 2))}
                                    error={!!errors.state}
                                    helperText={errors.state}
                                    fullWidth size="small"
                                    slotProps={{ htmlInput: { maxLength: 2 } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <MuiDialogActions>
                    <Button onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={processing}
                        onClick={() => post('/conta/enderecos', { onSuccess: () => { setOpen(false); reset(); } })}
                    >
                        {processing ? 'Salvando...' : 'Salvar Endereço'}
                    </Button>
                </MuiDialogActions>
            </Dialog>
        </AccountLayout>
    );
}
