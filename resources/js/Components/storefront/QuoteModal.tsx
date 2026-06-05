import { useState } from 'react';
import { maskPhone, maskCnpj } from '@/Lib/masks';
import {
    Box, Button, Dialog, DialogContent, DialogTitle, IconButton,
    Stack, TextField, Typography, Alert, CircularProgress, Divider, alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/Types/inertia';

interface QuoteItem { product_id: number; qty: number }

interface Props {
    open: boolean;
    onClose: () => void;
    items: QuoteItem[];
    productName?: string;
}

export default function QuoteModal({ open, onClose, items, productName }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const [loading, setLoading] = useState(false);
    const [done, setDone]       = useState(false);
    const [error, setError]     = useState('');
    const [form, setForm]       = useState({
        name:    auth.user?.name ?? '',
        email:   auth.user?.email ?? '',
        phone:   '',
        company: '',
        cnpj:    '',
        message: '',
        qty:     1,
    });

    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');

        const payload = {
            name:    form.name,
            email:   form.email,
            phone:   form.phone,
            company: form.company,
            cnpj:    form.cnpj,
            message: form.message,
            items:   items.map(i => ({ ...i, qty: form.qty })),
        };

        try {
            const res  = await fetch('/cotacao', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) { setDone(true); }
            else { setError(data.message ?? 'Erro ao enviar cotação.'); }
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => { onClose(); setTimeout(() => setDone(false), 300); };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <RequestQuoteIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Solicitar Cotação</Typography>
                </Stack>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5 }}>
                {done ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Cotação enviada!</Typography>
                        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                            Nossa equipe comercial entrará em contato em até 24h úteis com a melhor proposta.
                        </Typography>
                        <Button variant="contained" onClick={handleClose}>Fechar</Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={submit}>
                        {productName && (
                            <Box sx={{ bgcolor: alpha('#0B5FFF', 0.05), border: '1px solid', borderColor: 'primary.100', borderRadius: 2, p: 2, mb: 2.5 }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <RequestQuoteIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        Solicitando cotação para: {productName}
                                    </Typography>
                                </Stack>
                            </Box>
                        )}

                        <Stack spacing={2}>
                            {error && <Alert severity="error">{error}</Alert>}

                            <Stack direction="row" spacing={2}>
                                <TextField label="Nome completo *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required fullWidth size="small" />
                                <TextField label="E-mail *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required fullWidth size="small" />
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Telefone / WhatsApp"
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))}
                                    fullWidth size="small"
                                    placeholder="(11) 99999-9999"
                                    slotProps={{ htmlInput: { maxLength: 16 } }}
                                />
                                <TextField label="Quantidade desejada" type="number" inputProps={{ min: 1 }} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) }))} fullWidth size="small" />
                            </Stack>

                            <Divider>
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                    <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Dados da Empresa (opcional)</Typography>
                                </Stack>
                            </Divider>

                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Empresa / Razão Social"
                                    value={form.company}
                                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                    fullWidth size="small"
                                />
                                <TextField
                                    label="CNPJ"
                                    value={form.cnpj}
                                    onChange={e => setForm(f => ({ ...f, cnpj: maskCnpj(e.target.value) }))}
                                    fullWidth size="small"
                                    placeholder="00.000.000/0001-00"
                                    slotProps={{ htmlInput: { maxLength: 18 } }}
                                />
                            </Stack>

                            <TextField
                                label="Mensagem / Especificações adicionais"
                                value={form.message}
                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                multiline rows={3} fullWidth size="small"
                                placeholder="Descreva a aplicação, local de instalação, consumo estimado, prazo etc."
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RequestQuoteIcon />}
                                sx={{ py: 1.5, fontWeight: 700 }}
                            >
                                {loading ? 'Enviando...' : 'Solicitar Cotação'}
                            </Button>

                            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                                Resposta garantida em até 24h úteis • Sem compromisso
                            </Typography>
                        </Stack>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
