import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Box, Typography, Button, Paper, Stack, Chip, Grid, Divider,
    Table, TableBody, TableCell, TableHead, TableRow, Alert,
    IconButton, Tooltip,
} from '@mui/material';
import { useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ConsultantLayout from '@/Layouts/ConsultantLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { SharedProps } from '@/Types/inertia';

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
    tax_cents: number;
    total_cents: number;
    is_editable: boolean;
    is_expired: boolean;
    public_url: string;
    created_at: string;
    sent_at?: string;
    viewed_at?: string;
    accepted_at?: string;
    rejected_at?: string;
    items: ProposalItem[];
}

interface Props extends PageProps {
    proposal: ProposalDetail;
}

/** Converte "AAAA-MM-DD" para "DD/MM/AAAA" sem usar Date (evita shift de timezone). */
function formatIsoDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function generateProposalPDF(proposal: ProposalDetail, storeName: string) {
    const itemsRows = proposal.items.map((item) => `
        <tr>
            <td>${item.description}</td>
            <td style="text-align:center">${item.quantity} ${item.unit}</td>
            <td style="text-align:right">${formatBRL(item.unit_price_cents)}</td>
            <td style="text-align:right"><b>${formatBRL(item.total_cents)}</b></td>
        </tr>`).join('');

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Proposta ${proposal.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
    body { padding: 32px; color: #1A1A2E; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #0B5FFF; padding-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 900; color: #0B5FFF; }
    .ref { font-size: 11px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #F8F9FC; text-align: left; padding: 8px 10px; font-size: 11px; }
    td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; font-size: 12px; }
    .totals { margin-top: 16px; text-align: right; }
    .totals div { margin-bottom: 4px; }
    .grand-total { font-size: 16px; font-weight: 900; color: #0B5FFF; }
    .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #E5E7EB; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${storeName}</div>
      <div class="ref">Proposta ${proposal.reference} · Cliente: ${proposal.customer_name}</div>
      ${proposal.valid_until ? `<div class="ref">Válida até ${formatIsoDate(proposal.valid_until)}</div>` : ''}
    </div>
    <div><div style="font-size:18px; font-weight:700;">${proposal.title}</div></div>
  </div>

  <table>
    <thead><tr><th>Descrição</th><th style="text-align:center">Qtd.</th><th style="text-align:right">Preço Unit.</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <div>Subtotal: ${formatBRL(proposal.subtotal_cents)}</div>
    ${proposal.discount_cents > 0 ? `<div>Desconto: − ${formatBRL(proposal.discount_cents)}</div>` : ''}
    ${proposal.tax_cents > 0 ? `<div>Taxa/Imposto: + ${formatBRL(proposal.tax_cents)}</div>` : ''}
    <div class="grand-total">Total: ${formatBRL(proposal.total_cents)}</div>
  </div>

  ${proposal.notes ? `<div style="margin-top:24px"><b>Observações</b><p style="margin-top:6px; color:#555">${proposal.notes}</p></div>` : ''}

  <div class="footer">${storeName} · Proposta gerada automaticamente</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
}

export default function ShowProposal({ proposal }: Props) {
    const { branding } = usePage<SharedProps>().props;
    const storeName = branding?.store_name || 'Minha Loja';
    const [copied, setCopied] = useState(false);

    const handleSend = () => {
        router.post(`/consultor/propostas/${proposal.uuid}/enviar`);
    };

    const handleDelete = () => {
        if (!confirm('Excluir esta proposta? Esta ação não pode ser desfeita.')) return;
        router.delete(`/consultor/propostas/${proposal.uuid}`);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(proposal.public_url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const timeline = [
        { label: 'Criada', at: proposal.created_at },
        { label: 'Enviada', at: proposal.sent_at },
        { label: 'Visualizada', at: proposal.viewed_at },
        { label: 'Aceita', at: proposal.accepted_at },
        { label: 'Recusada', at: proposal.rejected_at },
    ].filter((t) => t.at);

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
                        {proposal.valid_until && ` · Válida até ${formatIsoDate(proposal.valid_until)}`}
                        {proposal.is_expired && ' · Expirada'}
                    </Typography>
                </Box>

                <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => generateProposalPDF(proposal, storeName)}
                    >
                        Gerar PDF
                    </Button>
                    {proposal.status !== 'draft' && (
                        <Tooltip title={copied ? 'Copiado!' : 'Copiar link de aceite'}>
                            <Button
                                variant="outlined"
                                startIcon={copied ? <CheckIcon /> : <LinkIcon />}
                                onClick={handleCopyLink}
                            >
                                Link de Aceite
                            </Button>
                        </Tooltip>
                    )}
                    {proposal.is_editable && (
                        <>
                            <Button
                                component={Link}
                                href={`/consultor/propostas/${proposal.uuid}/editar`}
                                variant="outlined"
                                startIcon={<EditIcon />}
                            >
                                Editar
                            </Button>
                            <Tooltip title={proposal.customer_email ? '' : 'Informe o e-mail do cliente para enviar'}>
                                <span>
                                    <Button
                                        variant="contained"
                                        startIcon={<SendIcon />}
                                        onClick={handleSend}
                                        disabled={!proposal.customer_email}
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Enviar por E-mail
                                    </Button>
                                </span>
                            </Tooltip>
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

            {timeline.length > 1 && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                        {timeline.map((t) => (
                            <Stack key={t.label} direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{t.label}:</Typography>
                                <Typography variant="caption">{t.at}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Paper>
            )}

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
                                    {proposal.tax_cents > 0 && (
                                        <Stack direction="row" gap={4}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Taxa / Imposto</Typography>
                                            <Typography variant="body2" sx={{ minWidth: 110, textAlign: 'right' }}>+ {formatBRL(proposal.tax_cents)}</Typography>
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
                            {proposal.tax_cents > 0 && (
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Taxa / Imposto</Typography>
                                    <Typography variant="body2">+ {formatBRL(proposal.tax_cents)}</Typography>
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
                            <Alert severity={proposal.is_expired ? 'warning' : 'info'} sx={{ mt: 2, fontSize: 12 }}>
                                {proposal.is_expired ? 'Expirou em' : 'Válida até'} {formatIsoDate(proposal.valid_until)}
                            </Alert>
                        )}

                        {proposal.status !== 'draft' && (
                            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Link de aceite do cliente
                                </Typography>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ wordBreak: 'break-all', flex: 1 }}>{proposal.public_url}</Typography>
                                    <IconButton size="small" onClick={handleCopyLink}>
                                        {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                                    </IconButton>
                                </Stack>
                            </Box>
                        )}

                        {proposal.is_editable && (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SendIcon />}
                                    onClick={handleSend}
                                    disabled={!proposal.customer_email}
                                    fullWidth
                                    sx={{ fontWeight: 700 }}
                                >
                                    Enviar por E-mail
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </ConsultantLayout>
    );
}
