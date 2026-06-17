import { Head } from '@inertiajs/react';
import {
    Box, Typography, Paper, Stack, Chip, Table, TableBody,
    TableCell, TableHead, TableRow, Alert,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountLayout from '@/Layouts/AccountLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface Transaction {
    type: 'earn' | 'redeem' | 'expire' | 'adjust';
    points: number;
    description: string;
    created_at: string;
    expires_at?: string;
}

interface Props extends PageProps {
    balance: number;
    lifetime: number;
    value_cents: number;
    transactions: Transaction[];
}

const TYPE_LABELS: Record<string, string> = {
    earn:   'Ganhos',
    redeem: 'Resgatados',
    expire: 'Expirados',
    adjust: 'Ajuste',
};

const TYPE_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
    earn:   'success',
    redeem: 'error',
    expire: 'warning',
    adjust: 'default',
};

export default function LoyaltyPoints({ balance, lifetime, value_cents, transactions }: Props) {
    return (
        <AccountLayout title="Meus Pontos">
            <Head title="Meus Pontos de Fidelidade" />

            <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Como funciona:</strong> Ganhe 1% do valor de cada pedido em pontos (1 ponto = R$ 0,01 em crédito). Pontos expiram em 12 meses. Resgate no checkout.
            </Alert>

            {/* KPIs */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <Paper elevation={0} sx={{ p: 3, flex: 1, border: '1px solid', borderColor: 'primary.200', bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <StarIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>{balance.toLocaleString('pt-BR')}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>pontos disponíveis</Typography>
                        </Box>
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main', mt: 1 }}>
                        = {formatBRL(value_cents)} em créditos
                    </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 3, flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: 32 }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>{lifetime.toLocaleString('pt-BR')}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>pontos acumulados no total</Typography>
                        </Box>
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                        = {formatBRL(lifetime)} em compras realizadas
                    </Typography>
                </Paper>
            </Stack>

            {/* Histórico */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Histórico de pontos</Typography>
                </Box>

                {transactions.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Nenhuma transação ainda. Faça sua primeira compra para ganhar pontos!
                        </Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Data</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Descrição</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Tipo</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: 'right' }}>Pontos</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Expira em</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((t, i) => (
                                <TableRow key={i} hover>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.created_at}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{t.description}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={TYPE_LABELS[t.type] ?? t.type}
                                            size="small"
                                            color={TYPE_COLORS[t.type] ?? 'default'}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 700, color: t.points > 0 ? 'success.main' : 'error.main' }}
                                        >
                                            {t.points > 0 ? '+' : ''}{t.points.toLocaleString('pt-BR')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {t.expires_at ?? '—'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>
        </AccountLayout>
    );
}
