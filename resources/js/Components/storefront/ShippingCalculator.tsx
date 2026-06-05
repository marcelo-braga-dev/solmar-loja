import { useState } from 'react';
import { maskCep } from '@/Lib/masks';
import {
    Box, Button, Stack, TextField, Typography, Collapse,
    CircularProgress, Divider, alpha,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ShippingOption {
    name: string;
    days: number;
    price_cents: number;
    free: boolean;
}

interface Props {
    weightGrams?: number | null;
    freeShippingMin: number;
    productPriceCents: number;
}

// Calcular frete simulado por faixa de CEP / região
function calcShipping(cep: string, weightGrams: number, productPrice: number, freeMin: number): ShippingOption[] {
    const region = parseInt(cep.slice(0, 2), 10);
    const isFree = productPrice >= freeMin;

    // Regiões por faixa de CEP
    const isSP   = region >= 1  && region <= 19;
    const isRJ   = region >= 20 && region <= 28;
    const isSul  = region >= 80 && region <= 99;
    const isNorte= region >= 66 && region <= 79;

    let sedex: ShippingOption;
    let pac: ShippingOption;

    if (isFree) {
        pac   = { name: 'PAC (Correios)', days: isSP ? 5 : isRJ ? 6 : isSul ? 8 : isNorte ? 14 : 10, price_cents: 0, free: true };
        sedex = { name: 'SEDEX (Correios)', days: isSP ? 2 : isRJ ? 2 : isSul ? 3 : 5, price_cents: Math.round(weightGrams * 0.018) + 1500, free: false };
    } else {
        const pacBase   = isSP ? 1290 : isRJ ? 1490 : isSul ? 1890 : isNorte ? 2890 : 1990;
        const sedexBase = isSP ? 2490 : isRJ ? 2890 : isSul ? 3490 : isNorte ? 5890 : 3990;
        const weight    = Math.max(1, weightGrams / 1000);

        pac   = { name: 'PAC (Correios)', days: isSP ? 5 : isRJ ? 6 : isSul ? 8 : isNorte ? 14 : 10, price_cents: Math.round(pacBase + weight * 200), free: false };
        sedex = { name: 'SEDEX (Correios)', days: isSP ? 2 : isRJ ? 2 : isSul ? 3 : 5, price_cents: Math.round(sedexBase + weight * 450), free: false };
    }

    return [pac, sedex];
}

function formatBRL(cents: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export default function ShippingCalculator({ weightGrams, freeShippingMin, productPriceCents }: Props) {
    const [cep, setCep]         = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ShippingOption[] | null>(null);
    const [error, setError]     = useState('');

    const cleanCep = cep.replace(/\D/g, '');

    const calculate = async () => {
        if (cleanCep.length !== 8) { setError('CEP deve ter 8 dígitos.'); return; }
        setError('');
        setLoading(true);

        // Verificar CEP via ViaCEP
        try {
            const res  = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await res.json();
            if (data.erro) { setError('CEP não encontrado.'); setLoading(false); return; }
        } catch {
            // Se ViaCEP falhar, usa só o cálculo local
        }

        // Calcular frete simulado
        const options = calcShipping(cleanCep, weightGrams ?? 5000, productPriceCents, freeShippingMin);
        await new Promise(r => setTimeout(r, 600)); // simula latência
        setResults(options);
        setLoading(false);
    };

    const handleCepChange = (v: string) => {
        const masked = maskCep(v);
        setCep(masked);
        setResults(null);
    };

    return (
        <Box sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2.5, p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                <LocalShippingIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Calcular frete</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                <TextField
                    size="small"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && calculate()}
                    error={!!error}
                    helperText={error}
                    sx={{ flex: 1 }}
                    slotProps={{ input: { inputProps: { maxLength: 9 } } }}
                />
                <Button
                    variant="outlined"
                    size="small"
                    onClick={calculate}
                    disabled={loading || cleanCep.length !== 8}
                    sx={{ flexShrink: 0, minWidth: 90 }}
                >
                    {loading ? <CircularProgress size={16} /> : 'Calcular'}
                </Button>
            </Stack>

            <Box
                component="a"
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: 11, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
                Não sei meu CEP
            </Box>

            <Collapse in={!!results}>
                {results && (
                    <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={1.2}>
                            {results.map((opt) => (
                                <Stack key={opt.name} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                        {opt.free && <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{opt.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Entrega em até {opt.days} dia{opt.days !== 1 ? 's úteis' : ' útil'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Typography sx={{
                                        fontWeight: 800, fontSize: 14,
                                        color: opt.free ? 'success.main' : 'text.primary',
                                    }}>
                                        {opt.free ? 'GRÁTIS' : formatBRL(opt.price_cents)}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                        {productPriceCents < freeShippingMin && (
                            <Box sx={{ mt: 1.5, p: 1.2, bgcolor: alpha('#0B5FFF', 0.05), borderRadius: 1.5 }}>
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                    💡 Adicione mais {formatBRL(freeShippingMin - productPriceCents)} para ganhar frete grátis no PAC!
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Collapse>
        </Box>
    );
}
