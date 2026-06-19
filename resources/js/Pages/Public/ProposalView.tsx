import { Head, router, usePage } from '@inertiajs/react';
import {
    Box, Container, Typography, Button, Paper, Stack, Chip, Divider,
    Table, TableBody, TableCell, TableHead, TableRow, Alert, TextField,
} from '@mui/material';
import { useState } from 'react';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { SharedProps } from '@/Types/inertia';

interface ProposalItem {
    id: number;
    description: string;
    unit: string;
    quantity: number;
    unit_price_cents: number;
    discount_percent: number;
    total_cents: number;
    product_name?: string;
}

interface PublicProposal {
    uuid: string;
    reference: string;
    title: string;
    customer_name: string;
    status: string;
    status_label: string;
    status_color: string;
    notes?: string;
    valid_until?: string;
    is_expired: boolean;
    is_respondable: boolean;
    subtotal_cents: number;
    discount_cents: number;
    tax_cents: number;
    total_cents: number;
    sent_at?: string;
    accepted_at?: string;
    rejected_at?: string;
    items: ProposalItem[];
}

interface Props extends PageProps {
    proposal: PublicProposal;
}

export default function ProposalView({ proposal }: Props) {
    const { branding, flash } = usePage<SharedProps>().props;
    const storeName = branding?.store_name || 'Minha Loja';
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAccept = () => {
        if (!confirm('Confirmar aceite desta proposta?')) return;
        setSubmitting(true);
        router.post(`/proposta/${proposal.uuid}/aceitar`, {}, { onFinish: () => setSubmitting(false) });
    };

    const handleReject = () => {
        setSubmitting(true);
        router.post(`/proposta/${proposal.uuid}/recusar`, { reason }, { onFinish: () => setSubmitting(false) });
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <Head title={`Proposta ${proposal.reference}`} />

            <Box sx={{ bgcolor: 'primary.main', py: 2.5, px: 3 }}>
                <Container maxWidth="md">
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                        {branding?.logo_url ? (
                            <Box component="img" src={branding.logo_url} alt={storeName} sx={{ height: 32, maxWidth: 160, objectFit: 'contain' }} />
                        ) : (
                            <>
                                <SolarPowerIcon sx={{ color: '#FFB300', fontSize: 26 }} />
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>{storeName}</Typography>
                            </>
                        )}
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: 5 }}>
                {flash?.success && <Alert severity="success" sx={{ mb: 3 }}>{flash.success}</Alert>}
                {flash?.error && <Alert severity="error" sx={{ mb: 3 }}>{flash.error}</Alert>}

                <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>{proposal.title}</Typography>
                        <Chip
                            label={proposal.status_label}
                            size="small"
                            sx={{
                                bgcolor: `${proposal.status_color}.50`,
                                color: `${proposal.status_color}.main`,
                                fontWeight: 600,
                                fontSize: 11,
                                border: '1px solid',
                                borderColor: `${proposal.status_color}.200`,
                            }}
                        />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Proposta <strong>{proposal.reference}</strong> para {proposal.customer_name}
                        {proposal.valid_until && ` · Válida até ${proposal.valid_until}`}
                    </Typography>

                    <Table size="small">
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Descrição</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: 'center', width: 60 }}>Qtd</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: 'right', width: 120 }}>Preço Unit.</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: 'right', width: 120 }}>Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {proposal.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.description}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2">{item.quantity} {item.unit}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2">{formatBRL(item.unit_price_cents)}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(item.total_cents)}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Divider sx={{ my: 2 }} />

                    <Stack sx={{ alignItems: 'flex-end', gap: 0.5 }}>
                        <Stack direction="row" spacing={4}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                            <Typography variant="body2" sx={{ minWidth: 110, textAlign: 'right' }}>{formatBRL(proposal.subtotal_cents)}</Typography>
                        </Stack>
                        {proposal.discount_cents > 0 && (
                            <Stack direction="row" spacing={4}>
                                <Typography variant="body2" sx={{ color: 'success.main' }}>Desconto</Typography>
                                <Typography variant="body2" sx={{ color: 'success.main', minWidth: 110, textAlign: 'right' }}>− {formatBRL(proposal.discount_cents)}</Typography>
                            </Stack>
                        )}
                        {proposal.tax_cents > 0 && (
                            <Stack direction="row" spacing={4}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Taxa / Imposto</Typography>
                                <Typography variant="body2" sx={{ minWidth: 110, textAlign: 'right' }}>+ {formatBRL(proposal.tax_cents)}</Typography>
                            </Stack>
                        )}
                        <Divider flexItem />
                        <Stack direction="row" spacing={4}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', minWidth: 110, textAlign: 'right' }}>
                                {formatBRL(proposal.total_cents)}
                            </Typography>
                        </Stack>
                    </Stack>

                    {proposal.notes && (
                        <>
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Observações</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>{proposal.notes}</Typography>
                        </>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {proposal.status === 'accepted' && (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                            Você aceitou esta proposta{proposal.accepted_at ? ` em ${proposal.accepted_at}` : ''}. Em breve nossa equipe entrará em contato.
                        </Alert>
                    )}

                    {proposal.status === 'rejected' && (
                        <Alert severity="info" icon={<CancelIcon />}>
                            Esta proposta foi recusada{proposal.rejected_at ? ` em ${proposal.rejected_at}` : ''}.
                        </Alert>
                    )}

                    {proposal.status !== 'accepted' && proposal.status !== 'rejected' && proposal.is_expired && (
                        <Alert severity="warning">Esta proposta expirou. Entre em contato para solicitar uma nova.</Alert>
                    )}

                    {proposal.is_respondable && (
                        <Stack spacing={2}>
                            {!showRejectForm ? (
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="large"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleAccept}
                                        disabled={submitting}
                                        fullWidth
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Aceitar Proposta
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="large"
                                        startIcon={<CancelIcon />}
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={submitting}
                                        fullWidth
                                    >
                                        Recusar
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack spacing={1.5}>
                                    <TextField
                                        label="Motivo da recusa (opcional)"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        multiline
                                        rows={2}
                                        fullWidth
                                        size="small"
                                    />
                                    <Stack direction="row" spacing={2}>
                                        <Button variant="contained" color="error" onClick={handleReject} disabled={submitting}>
                                            Confirmar Recusa
                                        </Button>
                                        <Button variant="text" onClick={() => setShowRejectForm(false)} disabled={submitting}>
                                            Cancelar
                                        </Button>
                                    </Stack>
                                </Stack>
                            )}
                        </Stack>
                    )}
                </Paper>

                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', textAlign: 'center', mt: 3 }}>
                    © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
                </Typography>
            </Container>
        </Box>
    );
}
