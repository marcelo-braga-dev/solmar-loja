import { Head, useForm } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack, Button,
    TextField, Divider, Radio, RadioGroup, FormControlLabel,
    Stepper, Step, StepLabel, CircularProgress, Chip,
    FormControl, InputLabel, Select, MenuItem, Alert,
} from '@mui/material';
import { useState } from 'react';
import CepField from '@/Components/ui/CepField';
import PixIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LockIcon from '@mui/icons-material/Lock';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StarIcon from '@mui/icons-material/Star';
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

interface ShippingOption {
    name: string;
    days: number;
    price_cents: number;
    free: boolean;
}

interface Props extends PageProps {
    cart: { items: CartItem[]; total_cents: number; item_count: number };
    addresses: AddressOption[];
}

const STEPS = ['Endereço', 'Entrega', 'Pagamento', 'Confirmação'];

const FREE_SHIPPING_THRESHOLD = 30000_00; // R$ 30.000 (em centavos)

function calcShippingOptions(cep: string, totalCents: number): ShippingOption[] {
    if (cep.replace(/\D/g, '').length < 8) return [];
    const free = totalCents >= FREE_SHIPPING_THRESHOLD;
    return [
        { name: 'PAC (Correios)', days: 8, price_cents: free ? 0 : 2990, free },
        { name: 'SEDEX (Correios)', days: 3, price_cents: free ? 0 : 5990, free },
    ];
}

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Checkout({ cart, addresses }: Props) {
    const [activeStep] = [0];
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [loadingShipping, setLoadingShipping] = useState(false);
    const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

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
        installments: 1,
        shipping_cents: 0,
        shipping_method: '',
    });

    const handleCepFill = (info: { logradouro: string; bairro: string; localidade: string; uf: string }) => {
        setData((prev) => ({
            ...prev,
            street: info.logradouro || prev.street,
            district: info.bairro || prev.district,
            city: info.localidade,
            state: info.uf,
        }));
    };

    const handleCepChange = (masked: string) => {
        setData('cep', masked);
        setShippingOptions([]);
        setSelectedShipping(null);
        setData('shipping_cents', 0);
        setData('shipping_method', '');
    };

    const handleCalculateShipping = () => {
        setLoadingShipping(true);
        setTimeout(() => {
            const options = calcShippingOptions(data.cep, cart.total_cents);
            setShippingOptions(options);
            if (options.length > 0) {
                setSelectedShipping(options[0]);
                setData('shipping_cents', options[0].price_cents);
                setData('shipping_method', options[0].name);
            }
            setLoadingShipping(false);
        }, 800);
    };

    const handleSelectShipping = (option: ShippingOption) => {
        setSelectedShipping(option);
        setData('shipping_cents', option.price_cents);
        setData('shipping_method', option.name);
    };

    const handleSelectAddress = (addr: AddressOption) => {
        setData({
            ...data,
            recipient: addr.recipient,
            cep: addr.cep,
            street: addr.street,
            number: addr.number,
            complement: addr.complement ?? '',
            district: addr.district,
            city: addr.city,
            state: addr.state,
        });
        setShippingOptions([]);
        setSelectedShipping(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/checkout');
    };

    const pixDiscount = data.payment_method === 'pix' ? Math.round(cart.total_cents * 0.05) : 0;
    const shippingCents = data.shipping_cents;
    const totalCents = cart.total_cents - pixDiscount + shippingCents;

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
                                                        onClick={() => handleSelectAddress(addr)}
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
                                                onChange={handleCepChange}
                                                onFill={handleCepFill}
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

                                {/* Frete */}
                                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                        <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                        Opções de Entrega
                                    </Typography>

                                    {shippingOptions.length === 0 ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                                                Preencha o CEP e calcule o frete
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleCalculateShipping}
                                                disabled={data.cep.replace(/\D/g, '').length < 8 || loadingShipping}
                                                startIcon={loadingShipping ? <CircularProgress size={14} /> : undefined}
                                            >
                                                {loadingShipping ? 'Calculando...' : 'Calcular Frete'}
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Stack spacing={1}>
                                            {shippingOptions.map((option) => (
                                                <Paper
                                                    key={option.name}
                                                    elevation={0}
                                                    onClick={() => handleSelectShipping(option)}
                                                    sx={{
                                                        p: 2, border: '1px solid', borderRadius: 2, cursor: 'pointer',
                                                        borderColor: selectedShipping?.name === option.name ? 'primary.main' : 'divider',
                                                        bgcolor: selectedShipping?.name === option.name ? 'primary.50' : 'transparent',
                                                    }}
                                                >
                                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                Prazo estimado: {option.days} dias úteis
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ textAlign: 'right' }}>
                                                            {option.free ? (
                                                                <Chip label="Grátis" size="small" color="success" />
                                                            ) : (
                                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                    {formatBRL(option.price_cents)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
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

                                    {data.payment_method === 'credit_card' && (
                                        <Box sx={{ mt: 2 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Parcelas</InputLabel>
                                                <Select
                                                    value={data.installments}
                                                    label="Parcelas"
                                                    onChange={(e) => setData('installments', Number(e.target.value))}
                                                >
                                                    {INSTALLMENT_OPTIONS.map((n) => {
                                                        const parcelValue = totalCents / n;
                                                        return (
                                                            <MenuItem key={n} value={n}>
                                                                {n === 1
                                                                    ? `À vista — ${formatBRL(totalCents)}`
                                                                    : `${n}x de ${formatBRL(parcelValue)} sem juros`}
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    )}
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
                                        {shippingCents === 0 && !selectedShipping ? (
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>A calcular</Typography>
                                        ) : selectedShipping?.free ? (
                                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>Grátis</Typography>
                                        ) : (
                                            <Typography variant="body2">{formatBRL(shippingCents)}</Typography>
                                        )}
                                    </Stack>
                                    {pixDiscount > 0 && (
                                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: 'success.main' }}>Desconto Pix (5%)</Typography>
                                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>− {formatBRL(pixDiscount)}</Typography>
                                        </Stack>
                                    )}
                                    <Divider />
                                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatBRL(totalCents)}</Typography>
                                    </Stack>
                                    {data.payment_method === 'credit_card' && data.installments > 1 && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                                            {data.installments}x de {formatBRL(totalCents / data.installments)} sem juros
                                        </Typography>
                                    )}
                                </Stack>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={processing || !selectedShipping}
                                    startIcon={<LockIcon />}
                                    sx={{ py: 1.5, fontWeight: 700 }}
                                >
                                    {processing ? 'Processando...' : 'Confirmar Pedido'}
                                </Button>

                                {!selectedShipping && (
                                    <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', textAlign: 'center', mt: 1 }}>
                                        Selecione uma opção de entrega para continuar
                                    </Typography>
                                )}
                                {/* Loyalty preview */}
                                <Alert
                                    severity="info"
                                    icon={<StarIcon fontSize="small" />}
                                    sx={{ mt: 1.5, fontSize: 12, '& .MuiAlert-message': { py: 0 } }}
                                >
                                    Você vai ganhar <strong>{Math.floor(totalCents * 0.01).toLocaleString('pt-BR')} pontos</strong> nessa compra (≈ {formatBRL(Math.floor(totalCents * 0.01))} em créditos)
                                </Alert>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 0.5 }}>
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
