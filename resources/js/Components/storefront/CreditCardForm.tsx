import { Alert, Box, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { MercadoPagoCardForm } from '@/Types/mercadopago';

export interface CreditCardTokenResult {
    token: string;
    paymentMethodId: string;
    issuerId: string;
    installments: number;
    identificationNumber: string;
}

export interface CreditCardFormHandle {
    tokenize: () => Promise<CreditCardTokenResult | null>;
}

interface Props {
    publicKey: string;
    amount: number;
}

const MP_SDK_URL = 'https://sdk.mercadopago.com/js/v2';

function loadMercadoPagoSdk(): Promise<void> {
    if (typeof window !== 'undefined' && window.MercadoPago) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const existing = document.getElementById('mp-sdk-script') as HTMLScriptElement | null;

        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Falha ao carregar o SDK do Mercado Pago')));
            return;
        }

        const script = document.createElement('script');
        script.id = 'mp-sdk-script';
        script.src = MP_SDK_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Falha ao carregar o SDK do Mercado Pago'));
        document.head.appendChild(script);
    });
}

const cardFieldSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    height: 40,
    px: 1.5,
    display: 'flex',
    alignItems: 'center',
    bgcolor: 'background.paper',
};

const nativeSelectStyle: React.CSSProperties = {
    width: '100%',
    height: 40,
    borderRadius: 4,
    border: '1px solid rgba(0, 0, 0, 0.23)',
    padding: '0 8px',
    fontSize: 14,
    fontFamily: 'inherit',
    background: 'transparent',
};

const CreditCardForm = forwardRef<CreditCardFormHandle, Props>(({ publicKey, amount }, ref) => {
    const cardFormRef = useRef<MercadoPagoCardForm | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!publicKey) {
            setError('Pagamento por cartão indisponível no momento. Escolha Pix ou Boleto.');
            return;
        }

        let cancelled = false;
        setReady(false);
        setError(null);

        loadMercadoPagoSdk()
            .then(() => {
                if (cancelled) return;

                const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });

                cardFormRef.current = mp.cardForm({
                    amount: amount.toFixed(2),
                    iframe: true,
                    form: {
                        id: 'mp-card-form',
                        cardNumber: { id: 'mp-card-number', placeholder: 'Número do cartão' },
                        expirationDate: { id: 'mp-expiration-date', placeholder: 'MM/AA' },
                        securityCode: { id: 'mp-security-code', placeholder: 'CVV' },
                        cardholderName: { id: 'mp-cardholder-name', placeholder: 'Nome impresso no cartão' },
                        issuer: { id: 'mp-issuer', placeholder: 'Banco emissor' },
                        installments: { id: 'mp-installments', placeholder: 'Parcelas' },
                        identificationType: { id: 'mp-identification-type', placeholder: 'Tipo de documento' },
                        identificationNumber: { id: 'mp-identification-number', placeholder: 'CPF do titular' },
                        cardholderEmail: { id: 'mp-cardholder-email', placeholder: 'E-mail' },
                    },
                    callbacks: {
                        onFormMounted: (mountError) => {
                            if (mountError) {
                                setError('Não foi possível carregar o formulário de cartão.');
                                return;
                            }
                            setReady(true);
                        },
                        onError: () => setError('Confira os dados do cartão e tente novamente.'),
                    },
                });
            })
            .catch(() => setError('Não foi possível carregar o pagamento por cartão.'));

        return () => {
            cancelled = true;
            cardFormRef.current?.unmount();
            cardFormRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey, amount]);

    useImperativeHandle(ref, () => ({
        tokenize: async () => {
            if (!cardFormRef.current) {
                setError('Formulário de cartão ainda não carregou. Aguarde e tente novamente.');
                return null;
            }

            try {
                const data = cardFormRef.current.getCardFormData();

                if (!data.token) {
                    setError('Confira os dados do cartão e tente novamente.');
                    return null;
                }

                return {
                    token: data.token,
                    paymentMethodId: data.paymentMethodId,
                    issuerId: data.issuerId,
                    installments: Number(data.installments),
                    identificationNumber: data.identificationNumber,
                };
            } catch {
                setError('Confira os dados do cartão e tente novamente.');
                return null;
            }
        },
    }));

    return (
        <Box id="mp-card-form" sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!ready && !error && (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Carregando formulário seguro do Mercado Pago...
                    </Typography>
                </Stack>
            )}

            <Stack spacing={2}>
                <Box>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                        Número do cartão
                    </Typography>
                    <Box id="mp-card-number" sx={cardFieldSx} />
                </Box>

                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                            Validade (MM/AA)
                        </Typography>
                        <Box id="mp-expiration-date" sx={cardFieldSx} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                            CVV
                        </Typography>
                        <Box id="mp-security-code" sx={cardFieldSx} />
                    </Box>
                </Stack>

                <TextField id="mp-cardholder-name" label="Nome impresso no cartão" size="small" fullWidth />

                <Stack direction="row" spacing={2}>
                    <TextField id="mp-cardholder-email" label="E-mail" size="small" fullWidth />
                    <TextField id="mp-identification-number" label="CPF do titular" size="small" fullWidth />
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                            Tipo de documento
                        </Typography>
                        <select id="mp-identification-type" style={nativeSelectStyle} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                            Banco emissor
                        </Typography>
                        <select id="mp-issuer" style={nativeSelectStyle} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                            Parcelas
                        </Typography>
                        <select id="mp-installments" style={nativeSelectStyle} />
                    </Box>
                </Stack>
            </Stack>
        </Box>
    );
});

CreditCardForm.displayName = 'CreditCardForm';

export default CreditCardForm;
