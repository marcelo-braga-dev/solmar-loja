import { Head, useForm } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack, Button,
    TextField, Divider, Radio, RadioGroup, FormControlLabel,
    Stepper, Step, StepLabel,
} from '@mui/material';
import CepField from '@/Components/ui/CepField';
import PixIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LockIcon from '@mui/icons-material/Lock';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface AddressOption {
    id: number;
    label: string;
    full: string;
    recipient: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
}

interface CartItem {
    id: number;
    name: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    cover_image?: string;
}

interface Props extends PageProps {
    cart: { items: CartItem[]; total_cents: number; item_count: number };
    addresses: AddressOption[];
}

const STEPS = ['Endereço', 'Entrega', 'Pagamento', 'Confirmação'];

export default function Checkout({ cart, addresses }: Props) {
    const [activeStep] = [0]; // Simplified single step for now

    const defaultAddress = addresses[0];

    const { data, setData, post, processing, errors } = useForm({
        recipient: defaultAddress?.recipient ?? '',
        cep: defaultAddress?.cep ?? '',
        street: defaultAddress?.street ?? '',
        number: defaultAddress?.number ?? '',
        complement: defaultAddress?.complement ?? '',
        district: defaultAddress?.district ?? '',
        city: defaultAddress?.city ?? '',
        state: defaultAddress?.state ?? '',
        payment_method: 'pix',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/checkout');
    };

    return (
        <StorefrontLayout>
            <Head title="Checkout — SolarHub Commerce" />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Finalizar Compra</Typography>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {STEPS.map((label) => (
                        <Step key={label}><StepLabel>{label}</StepLabel></Step>
                    ))}
                </Stepper>

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Stack spacing={3}>
                                {/* Endereço */}
                                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Endereço de Entrega</Typography>

                                    {addresses.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Seus endereços salvos:</Typography>
                                            <Stack spacing={1}>
                                                {addresses.map((addr) => (
                                                    <Paper
                                                        key={addr.id}
                                                        elevation={0}
                                                        onClick={() => setData({ ...data, recipient: addr.recipient, cep: addr.cep, street: addr.street, number: addr.number, complement: addr.complement ?? '', district: addr.district, city: addr.city, state: addr.state })}
                                                        sx={{ p: 2, border: '1px solid', borderColor: addr.cep === data.cep ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer', bgcolor: addr.cep === data.cep ? 'primary.50' : 'transparent' }}
                                                    >
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{addr.label}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{addr.full}</Typography>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                            <Divider sx={{ my: 2 }}>ou informe outro endereço</Divider>
                                        </Box>
                                    )}

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField label="Destinatário *" value={data.recipient} onChange={(e) => setData('recipient', e.target.value)} error={!!errors.recipient} helperText={errors.recipient} fullWidth size="small" />
                                        </Grid>
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
                                            <TextField label="Rua *" value={data.street} onChange={(e) => setData('street', e.target.value)} error={!!errors.street} helperText={errors.street} fullWidth size="small" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField label="Número *" value={data.number} onChange={(e) => setData('number', e.target.value)} error={!!errors.number} helperText={errors.number} fullWidth size="small" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 8 }}>
                                            <TextField label="Complemento" value={data.complement} onChange={(e) => setData('complement', e.target.value)} fullWidth size="small" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField label="Bairro *" value={data.district} onChange={(e) => setData('district', e.target.value)} error={!!errors.district} helperText={errors.district} fullWidth size="small" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField label="Cidade *" value={data.city} onChange={(e) => setData('city', e.target.value)} error={!!errors.city} helperText={errors.city} fullWidth size="small" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 2 }}>
                                            <TextField label="UF *" value={data.state} onChange={(e) => setData('state', e.target.value.toUpperCase())} error={!!errors.state} helperText={errors.state} fullWidth size="small" slotProps={{ htmlInput: { maxLength: 2 } }} />
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Pagamento */}
                                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Forma de Pagamento</Typography>
                                    <RadioGroup value={data.payment_method} onChange={(e) => setData('payment_method', e.target.value)}>
                                        {[
                                            { value: 'pix', label: 'Pix', desc: '5% de desconto — aprovação imediata', icon: <PixIcon /> },
                                            { value: 'boleto', label: 'Boleto Bancário', desc: 'Vence em 3 dias úteis', icon: <ReceiptIcon /> },
                                            { value: 'credit_card', label: 'Cartão de Crédito', desc: 'Até 12x sem juros', icon: <CreditCardIcon /> },
                                        ].map((option) => (
                                            <Paper
                                                key={option.value}
                                                elevation={0}
                                                sx={{
                                                    mb: 1, border: '1px solid', borderRadius: 2, overflow: 'hidden',
                                                    borderColor: data.payment_method === option.value ? 'primary.main' : 'divider',
                                                    bgcolor: data.payment_method === option.value ? 'primary.50' : 'transparent',
                                                }}
                                            >
                                                <FormControlLabel
                                                    value={option.value}
                                                    control={<Radio />}
                                                    label={
                                                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 0.5 }}>
                                                            <Box sx={{ color: 'primary.main' }}>{option.icon}</Box>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.label}</Typography>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{option.desc}</Typography>
                                                            </Box>
                                                        </Stack>
                                                    }
                                                    sx={{ width: '100%', m: 0, px: 2, py: 1 }}
                                                />
                                            </Paper>
                                        ))}
                                    </RadioGroup>
                                </Paper>
                            </Stack>
                        </Grid>

                        {/* Resumo */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 80 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resumo</Typography>

                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    {cart.items.map((item) => (
                                        <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>
                                                {item.name} × {item.quantity}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 600, ml: 1 }}>
                                                {formatBRL(item.total_cents)}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>

                                <Divider sx={{ mb: 2 }} />

                                <Stack spacing={1} sx={{ mb: 3 }}>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                                        <Typography variant="body2">{formatBRL(cart.total_cents)}</Typography>
                                    </Stack>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Frete</Typography>
                                        <Typography variant="body2" sx={{ color: 'success.main' }}>A calcular</Typography>
                                    </Stack>
                                    <Divider />
                                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatBRL(cart.total_cents)}</Typography>
                                    </Stack>
                                </Stack>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={processing}
                                    startIcon={<LockIcon />}
                                    sx={{ py: 1.5, fontWeight: 700 }}
                                >
                                    {processing ? 'Processando...' : 'Confirmar Pedido'}
                                </Button>

                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
                                    Compra 100% segura e protegida
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </StorefrontLayout>
    );
}
