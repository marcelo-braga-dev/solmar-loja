import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Typography, Button, Paper, Stack, Chip, Grid, Divider,
    Table, TableBody, TableCell, TableHead, TableRow, Alert,
    IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ConsultantLayout from '@/Layouts/ConsultantLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface ProposalItem {
    id: number;
    item_type: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price_cents: number;
    discount_percent: number;
    total_cents: number;
    product_name?: string;
    product_slug?: string;
}

interface ProposalDetail {
    uuid: string;
    reference: string;
    title: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_city?: string;
    customer_state?: string;
    status: string;
    status_label: string;
    status_color: string;
    notes?: string;
    valid_until?: string;
    subtotal_cents: number;
    discount_cents: number;
    total_cents: number;
    is_editable: boolean;
    created_at: string;
    items: ProposalItem[];
}

interface Props extends PageProps {
    proposal: ProposalDetail;
}

export default function ShowProposal({ proposal }: Props) {
    const handleSend = () => {
        router.post(`/consultor/propostas/${proposal.uuid}/enviar`);
    };

    const handleDelete = () => {
        if (!confirm('Excluir esta proposta? Esta ação não pode ser desfeita.')) return;
        router.delete(`/consultor/propostas/${proposal.uuid}`);
    };

    return (
        <ConsultantLayout title={`Proposta ${proposal.reference}`}>
            <Head title={`Proposta ${proposal.reference} — Consultor`} />

            <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 2, mb: 3 }}>
                <IconButton component={Link} href="/consultor/propostas" size="small" sx={{ mt: 0.5 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Ref: <strong>{proposal.reference}</strong> · Criada em {proposal.created_at}
                        {proposal.valid_until && ` · Válida até ${proposal.valid_until}`}
                    </Typography>
                </Box>

                <Stack direction="row" gap={1}>
                    {proposal.is_editable && (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<SendIcon />}
                                onClick={handleSend}
                                sx={{ fontWeight: 700 }}
                            >
                                Marcar como Enviada
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDelete}
                            >
                                Excluir
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Stack spacing={3}>
                        {/* Dados do cliente */}
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Cliente</Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Nome</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{proposal.customer_name}</Typography>
                                </Grid>
                                {proposal.customer_email && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>E-mail</Typography>
                                        <Typography variant="body2">{proposal.customer_email}</Typography>
                                    </Grid>
                                )}
                                {proposal.customer_phone && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Telefone</Typography>
                                        <Typography variant="body2">{proposal.customer_phone}</Typography>
                                    </Grid>
                                )}
                                {proposal.customer_city && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Localização</Typography>
                                        <Typography variant="body2">
                                            {proposal.customer_city}{proposal.customer_state ? `/${proposal.customer_state}` : ''}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>

                        {/* Itens */}
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Itens</Typography>

                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Descrição</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: 'center', width: 60 }}>Qtd</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: 'right', width: 120 }}>Preço Unit.</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: 'center', width: 70 }}>Desc %</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: 'right', width: 120 }}>Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {proposal.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {item.description}
                                                </Typography>
                                                {item.product_slug && (
                                                    <Typography variant="caption" sx={{ color: 'primary.main' }}>
                                                        <Link href={`/produtos/${item.product_slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                            Ver produto
                                                        </Link>
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Typography variant="body2">{item.quantity} {item.unit}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2">{formatBRL(item.unit_price_cents)}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Typography variant="body2" sx={{ color: item.discount_percent > 0 ? 'success.main' : 'text.secondary' }}>
                                                    {item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    {formatBRL(item.total_cents)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Divider sx={{ my: 2 }} />
                            <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 3 }}>
                                <Stack sx={{ alignItems: 'flex-end', gap: 0.5 }}>
                                    <Stack direction="row" gap={4}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                                        <Typography variant="body2" sx={{ minWidth: 110, textAlign: 'right' }}>{formatBRL(proposal.subtotal_cents)}</Typography>
                                    </Stack>
                                    {proposal.discount_cents > 0 && (
                                        <Stack direction="row" gap={4}>
                                            <Typography variant="body2" sx={{ color: 'success.main' }}>Desconto</Typography>
                                            <Typography variant="body2" sx={{ color: 'success.main', minWidth: 110, textAlign: 'right' }}>− {formatBRL(proposal.discount_cents)}</Typography>
                                        </Stack>
                                    )}
                                    <Divider flexItem />
                                    <Stack direction="row" gap={4}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', minWidth: 110, textAlign: 'right' }}>
                                            {formatBRL(proposal.total_cents)}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Paper>

                        {proposal.notes && (
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Observações</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                                    {proposal.notes}
                                </Typography>
                            </Paper>
                        )}
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Resumo Financeiro</Typography>
                        <Stack spacing={1}>
                            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                                <Typography variant="body2">{formatBRL(proposal.subtotal_cents)}</Typography>
                            </Stack>
                            {proposal.discount_cents > 0 && (
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'success.main' }}>Desconto</Typography>
                                    <Typography variant="body2" sx={{ color: 'success.main' }}>− {formatBRL(proposal.discount_cents)}</Typography>
                                </Stack>
                            )}
                            <Divider />
                            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {formatBRL(proposal.total_cents)}
                                </Typography>
                            </Stack>
                        </Stack>

                        {proposal.valid_until && (
                            <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
                                Válida até {proposal.valid_until}
                            </Alert>
                        )}

                        {proposal.is_editable && (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SendIcon />}
                                    onClick={handleSend}
                                    fullWidth
                                    sx={{ fontWeight: 700 }}
                                >
                                    Marcar como Enviada
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </ConsultantLayout>
    );
}
