import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Container, Typography, Paper, Stack, Button,
    Alert, CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PixIcon from '@mui/icons-material/AccountBalance';
import { useState, type ElementType } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface PaymentData {
    uuid: string;
    method: string;
    status: string;
    status_label: string;
    pix_qr_code?: string;
    pix_copy_paste?: string;
    boleto_url?: string;
    boleto_barcode?: string;
    expires_at?: string;
    paid_at?: string;
}

interface Props extends PageProps {
    order: { uuid: string; status: string; total_cents: number };
    payment: PaymentData | null;
}

export default function PaymentPage({ order, payment }: Props) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isApproved = payment?.status === 'approved' || order.status === 'paid';

    return (
        <StorefrontLayout>
            <Head title="Pagamento do Pedido" />
            <Container maxWidth="md" sx={{ py: 6 }}>
                {isApproved ? (
                    <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'success.200', borderRadius: 3, bgcolor: 'success.50' }}>
                        <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Pagamento Confirmado!</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                            Seu pedido foi confirmado e está sendo preparado.
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                            <Button component={Link as ElementType} href={`/conta/pedidos/${order.uuid}`} variant="contained">
                                Ver meu pedido
                            </Button>
                            <Button component={Link as ElementType} href="/" variant="outlined">
                                Continuar comprando
                            </Button>
                        </Stack>
                    </Paper>
                ) : (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>Finalizar Pagamento</Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Total: <strong>{formatBRL(order.total_cents)}</strong>
                            </Typography>
                        </Box>

                        {!payment && (
                            <Alert severity="warning">
                                Nenhum pagamento iniciado ainda.{' '}
                                <Box component={Link as ElementType} href={`/conta/pedidos/${order.uuid}`} sx={{ color: 'inherit', fontWeight: 600 }}>Ver pedido</Box>
                            </Alert>
                        )}

                        {payment?.method === 'pix' && payment.pix_copy_paste && (
                            <Paper elevation={0} sx={{ p: 4, border: '2px solid', borderColor: 'primary.main', borderRadius: 3 }}>
                                <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
                                    <PixIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Pague com Pix</Typography>
                                    <Alert severity="success" sx={{ width: '100%' }}>
                                        5% de desconto aplicado automaticamente no Pix!
                                    </Alert>

                                    {payment.pix_qr_code && (
                                        <Box>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>QR Code</Typography>
                                            <Box
                                                component="img"
                                                src={`data:image/png;base64,${payment.pix_qr_code}`}
                                                alt="QR Code Pix"
                                                sx={{ width: 200, height: 200, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </Box>
                                    )}

                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Pix Copia e Cola</Typography>
                                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>
                                            {payment.pix_copy_paste}
                                        </Paper>
                                        <Button
                                            variant="contained"
                                            startIcon={<ContentCopyIcon />}
                                            onClick={() => copyToClipboard(payment.pix_copy_paste!)}
                                            sx={{ mt: 1.5 }}
                                            color={copied ? 'success' : 'primary'}
                                            fullWidth
                                        >
                                            {copied ? 'Copiado!' : 'Copiar código Pix'}
                                        </Button>
                                    </Box>

                                    {payment.expires_at && (
                                        <Typography variant="caption" sx={{ color: 'warning.main' }}>
                                            Expira em: {new Date(payment.expires_at).toLocaleString('pt-BR')}
                                        </Typography>
                                    )}

                                    <Button
                                        variant="outlined"
                                        onClick={() => router.reload()}
                                        startIcon={<CircularProgress size={14} />}
                                    >
                                        Verificar pagamento
                                    </Button>
                                </Stack>
                            </Paper>
                        )}

                        {payment?.method === 'boleto' && payment.boleto_barcode && (
                            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                <Stack spacing={3}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Boleto Bancário</Typography>
                                    <Alert severity="info">
                                        Pague o boleto em qualquer banco, lotérica ou pelo app do seu banco. Vence em até 3 dias úteis.
                                    </Alert>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Código de barras</Typography>
                                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, fontFamily: 'monospace', fontSize: 13 }}>
                                            {payment.boleto_barcode}
                                        </Paper>
                                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => copyToClipboard(payment.boleto_barcode!)} color={copied ? 'success' : 'primary'}>
                                                {copied ? 'Copiado!' : 'Copiar código'}
                                            </Button>
                                            {payment.boleto_url && (
                                                <Button variant="contained" startIcon={<OpenInNewIcon />} href={payment.boleto_url} target="_blank">
                                                    Ver boleto PDF
                                                </Button>
                                            )}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Paper>
                        )}

                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Após o pagamento, você receberá um e-mail de confirmação.{' '}
                                <Box component={Link as ElementType} href={`/conta/pedidos/${order.uuid}`} sx={{ color: 'primary.main', fontWeight: 600 }}>
                                    Acompanhe seu pedido aqui.
                                </Box>
                            </Typography>
                        </Paper>
                    </Stack>
                )}
            </Container>
        </StorefrontLayout>
    );
}
