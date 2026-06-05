import { Head, router, useForm } from '@inertiajs/react';
import {
    Alert, Box, Button, Grid, Paper, Stack, Tab, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tabs, Typography,
    FormControl, InputLabel, Select, MenuItem, TextField, Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import { useState } from 'react';

interface DayRevenue { date: string; revenue: number; orders: number }
interface TopProduct  { name: string; qty: number; revenue: number }

interface DreData {
    period: { start: string; end: string };
    gross_revenue: number;
    total_expenses: number;
    net_result: number;
}

interface Props extends PageProps {
    period: string;
    kpis: { revenue: number; orders_count: number; avg_ticket: number; canceled_count: number };
    revenueByDay: DayRevenue[];
    topProducts: TopProduct[];
    dre: DreData;
}

function printReport(kpis: Props['kpis'], revenueByDay: DayRevenue[], topProducts: TopProduct[], dre: DreData, period: string) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatório de Vendas — SolarHub Commerce</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
    body { padding: 32px; color: #1A1A2E; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #0B5FFF; padding-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 900; color: #0B5FFF; }
    .logo span { color: #FFB300; }
    .period { font-size: 11px; color: #666; margin-top: 4px; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; text-align: center; }
    .kpi-value { font-size: 20px; font-weight: 900; color: #0B5FFF; }
    .kpi-label { font-size: 11px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #0B5FFF; border-left: 3px solid #0B5FFF; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F3F4F6; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #666; padding: 8px 10px; text-align: left; border-bottom: 2px solid #E5E7EB; }
    td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; font-size: 12px; }
    tr:nth-child(even) td { background: #FAFAFA; }
    .text-right { text-align: right; }
    .dre-positive { color: #16A34A; font-weight: 700; }
    .dre-negative { color: #DC2626; font-weight: 700; }
    .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #E5E7EB; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Solar<span>Hub</span> Commerce</div>
      <div class="period">Período: ${period} · Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
    </div>
    <div>
      <div class="title">Relatório de Vendas</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-value">${formatBRL(kpis.revenue)}</div>
      <div class="kpi-label">Receita Total</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${kpis.orders_count}</div>
      <div class="kpi-label">Pedidos</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${formatBRL(kpis.avg_ticket)}</div>
      <div class="kpi-label">Ticket Médio</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${kpis.canceled_count}</div>
      <div class="kpi-label">Cancelados</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">DRE — Demonstrativo de Resultado</div>
    <table>
      <tr><td><b>Receita Bruta</b></td><td class="text-right dre-positive">${formatBRL(dre.gross_revenue)}</td></tr>
      <tr><td>Despesas / Devoluções</td><td class="text-right dre-negative">${formatBRL(dre.total_expenses)}</td></tr>
      <tr><td><b>Resultado Líquido</b></td><td class="text-right ${dre.net_result >= 0 ? 'dre-positive' : 'dre-negative'}">${formatBRL(dre.net_result)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Top 10 Produtos por Receita</div>
    <table>
      <thead>
        <tr><th>#</th><th>Produto</th><th class="text-right">Qtd.</th><th class="text-right">Receita</th></tr>
      </thead>
      <tbody>
        ${topProducts.slice(0, 10).map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.name}</td>
          <td class="text-right">${p.qty}</td>
          <td class="text-right"><b>${formatBRL(p.revenue)}</b></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Receita por Dia (últimos 30 dias)</div>
    <table>
      <thead>
        <tr><th>Data</th><th class="text-right">Receita</th><th class="text-right">Pedidos</th></tr>
      </thead>
      <tbody>
        ${revenueByDay.filter(d => d.revenue > 0).map(d => `
        <tr>
          <td>${d.date}</td>
          <td class="text-right">${formatBRL(d.revenue)}</td>
          <td class="text-right">${d.orders}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    SolarHub Commerce · Relatório gerado automaticamente · Dados internos e confidenciais
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
}

export default function ReportsIndex({ period, kpis, revenueByDay, topProducts, dre }: Props) {
    const [tab, setTab] = useState(0);

    const exportForm = useForm({
        type: 'orders' as 'orders' | 'dre',
        start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    const PERIOD_OPTIONS = [
        { value: 'week', label: 'Esta semana' },
        { value: 'month', label: 'Este mês' },
        { value: 'year', label: 'Este ano' },
    ];

    const stats = [
        { icon: <TrendingUpIcon />, label: 'Receita do período', value: formatBRL(kpis.revenue), color: 'success.main' },
        { icon: <ShoppingCartIcon />, label: 'Pedidos realizados', value: String(kpis.orders_count), color: 'primary.main' },
        { icon: <ReceiptLongIcon />, label: 'Ticket médio', value: formatBRL(kpis.avg_ticket), color: 'info.main' },
        { icon: <CancelIcon />, label: 'Pedidos cancelados', value: String(kpis.canceled_count), color: 'error.main' },
    ];

    const handleExport = (e: React.FormEvent) => {
        e.preventDefault();
        exportForm.post('/admin/reports/export');
    };

    const dreRows = [
        { label: 'Receita Bruta', value: dre.gross_revenue, bold: false, positive: true },
        { label: 'Total de Despesas', value: -dre.total_expenses, bold: false, positive: false },
        { label: 'Resultado Líquido', value: dre.net_result, bold: true, positive: dre.net_result >= 0 },
    ];

    return (
        <AdminLayout title="Relatórios" breadcrumbs={[{ label: 'Análises' }, { label: 'Relatórios' }]}>
            <Head title="Relatórios — Admin" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Relatórios de Vendas</Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Período</InputLabel>
                        <Select value={period} label="Período" onChange={(e) => router.get('/admin/reports', { period: e.target.value })}>
                            {PERIOD_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => printReport(kpis, revenueByDay, topProducts, dre, period)}
                        size="small"
                    >
                        Exportar PDF
                    </Button>
                </Stack>
            </Stack>

            {/* KPIs */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stats.map((stat) => (
                    <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>{stat.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Vendas por dia" />
                <Tab label="DRE" />
                <Tab label="Exportar CSV" />
            </Tabs>

            {tab === 0 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Receita por dia (últimos 30 dias)</Typography>
                            {revenueByDay.length === 0 ? (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sem dados no período.</Typography>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                                                <TableCell>Data</TableCell>
                                                <TableCell align="right">Pedidos</TableCell>
                                                <TableCell align="right">Receita</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {revenueByDay.map((row) => (
                                                <TableRow key={row.date} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell>{new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                                                    <TableCell align="right">{row.orders}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBRL(row.revenue)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Top 10 Produtos</Typography>
                            {topProducts.length === 0 ? (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sem dados.</Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {topProducts.map((p, i) => (
                                        <Box key={i}>
                                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box sx={{ flex: 1, mr: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{p.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.qty} un.</Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(p.revenue)}</Typography>
                                            </Stack>
                                            {i < topProducts.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {tab === 1 && (
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 600 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Demonstrativo de Resultado do Exercício
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Período: {dre.period.start} a {dre.period.end}
                    </Typography>
                    <Table>
                        <TableBody>
                            {dreRows.map((row) => (
                                <TableRow key={row.label} sx={{ '& td': { borderBottom: row.label === 'Total de Despesas' ? '2px solid' : 'inherit', borderColor: 'divider' } }}>
                                    <TableCell sx={{ fontWeight: row.bold ? 700 : 400, fontSize: row.bold ? 16 : 14 }}>
                                        {row.label}
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        fontWeight: row.bold ? 700 : 400,
                                        fontSize: row.bold ? 16 : 14,
                                        color: row.bold
                                            ? (row.positive ? 'success.main' : 'error.main')
                                            : (row.value >= 0 ? 'inherit' : 'error.main'),
                                    }}>
                                        {formatBRL(Math.abs(row.value))}
                                        {row.value < 0 && !row.bold ? ' (-)' : ''}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box sx={{ mt: 2, p: 2, bgcolor: dre.net_result >= 0 ? 'success.50' : 'error.50', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ color: dre.net_result >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                            {dre.net_result >= 0 ? '✓ Resultado positivo no período' : '⚠ Resultado negativo no período'}
                        </Typography>
                    </Box>
                </Paper>
            )}

            {tab === 2 && (
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 500 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Exportar relatório CSV</Typography>

                    {exportForm.recentlySuccessful && (
                        <Alert severity="success" sx={{ mb: 2 }}>Exportação iniciada! O arquivo ficará disponível em storage/app/public/exports/.</Alert>
                    )}

                    <Box component="form" onSubmit={handleExport}>
                        <Stack spacing={2}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Tipo de relatório</InputLabel>
                                <Select
                                    value={exportForm.data.type}
                                    label="Tipo de relatório"
                                    onChange={(e) => exportForm.setData('type', e.target.value as 'orders' | 'dre')}
                                >
                                    <MenuItem value="orders">Pedidos</MenuItem>
                                    <MenuItem value="dre">DRE (Financeiro)</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Data início"
                                type="date"
                                value={exportForm.data.start}
                                onChange={(e) => exportForm.setData('start', e.target.value)}
                                size="small"
                                fullWidth
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField
                                label="Data fim"
                                type="date"
                                value={exportForm.data.end}
                                onChange={(e) => exportForm.setData('end', e.target.value)}
                                size="small"
                                fullWidth
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                disabled={exportForm.processing}
                            >
                                {exportForm.processing ? 'Aguarde...' : 'Gerar CSV'}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            )}
        </AdminLayout>
    );
}
