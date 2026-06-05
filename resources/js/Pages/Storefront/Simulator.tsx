import { Head, Link, usePage } from '@inertiajs/react';
import {
    Box, Container, Typography, Grid, Paper, Stack, Button,
    TextField, Select, MenuItem, InputLabel, FormControl,
    Stepper, Step, StepLabel, Alert, Chip,
    InputAdornment, CircularProgress,
} from '@mui/material';
import { type ElementType } from 'react';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BoltIcon from '@mui/icons-material/Bolt';
import Co2Icon from '@mui/icons-material/Co2';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalculateIcon from '@mui/icons-material/Calculate';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useState } from 'react';
import type { SharedProps } from '@/Types/inertia';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { formatBRL } from '@/Lib/formatters';
import axios from '@/Lib/axios';
import type { PageProps } from '@inertiajs/react';

interface SimulatorResult {
    input: { monthly_kwh: number; state: string; roof_type: string };
    result: {
        system_power_kwp: number;
        panel_count: number;
        panel_power_w: number;
        annual_generation_kwh: number;
        monthly_bill_estimate: number;
        monthly_savings_cents: number;
        annual_savings_cents: number;
        system_cost_cents: number;
        payback_years: number | null;
        roof_area_m2: number;
        co2_saved_kg_year: number;
        irradiance: number;
    };
    suggested_kit: { id: number; name: string; slug: string; price_cents: number } | null;
    disclaimer: string;
}

const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const STEPS = ['Consumo', 'Localização', 'Resultado'];

function generateProposalPDF(result: SimulatorResult, branding: { store_name?: string; store_email?: string; store_phone?: string }) {
    const storeName = branding?.store_name ?? 'SolarHub Commerce';
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Proposta Solar — ${storeName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:Arial,sans-serif; }
    body { padding:40px; color:#1A1A2E; font-size:13px; }
    .header { background:linear-gradient(135deg,#0D1B3E,#0B5FFF); color:white; padding:32px; border-radius:12px; margin-bottom:24px; }
    .logo { font-size:26px; font-weight:900; margin-bottom:4px; }
    .logo span { color:#FFB300; }
    .tagline { opacity:0.7; font-size:12px; }
    .section { margin-bottom:24px; page-break-inside:avoid; }
    .section-title { font-size:15px; font-weight:800; color:#0B5FFF; border-left:4px solid #0B5FFF; padding-left:10px; margin-bottom:14px; }
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .kpi { border:1px solid #E5E7EB; border-radius:10px; padding:16px; text-align:center; }
    .kpi-value { font-size:22px; font-weight:900; color:#0B5FFF; }
    .kpi-label { font-size:11px; color:#666; margin-top:4px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#F3F4F6; font-size:11px; font-weight:700; text-transform:uppercase; color:#666; padding:10px 12px; text-align:left; }
    td { padding:10px 12px; border-bottom:1px solid #F3F4F6; }
    tr:last-child td { border-bottom:none; }
    .highlight { background:#F0F7FF; font-weight:700; }
    .footer { margin-top:32px; border-top:2px solid #0B5FFF; padding-top:16px; display:flex; justify-content:space-between; font-size:11px; color:#666; }
    .badge { display:inline-block; background:#F0F7FF; color:#0B5FFF; border:1px solid #BBD6FF; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; margin-right:6px; }
    @media print { body { padding:24px; } .header { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${storeName.split(' ')[0]}<span>${storeName.split(' ').slice(1).join(' ')}</span></div>
    <div class="tagline">Proposta de Sistema Solar Fotovoltaico • ${new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}</div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpi-value">R$ ${(result.result.monthly_savings_cents/100).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div class="kpi-label">Economia mensal estimada</div></div>
    <div class="kpi"><div class="kpi-value">${result.result.system_power_kwp} kWp</div><div class="kpi-label">Potência do sistema</div></div>
    <div class="kpi"><div class="kpi-value">${result.result.payback_years ?? '—'} anos</div><div class="kpi-label">Payback estimado</div></div>
    <div class="kpi"><div class="kpi-value">${result.result.co2_saved_kg_year} kg</div><div class="kpi-label">CO₂ evitado por ano</div></div>
  </div>

  <div class="section">
    <div class="section-title">📊 Dados do Consumo</div>
    <table>
      <tr><td><b>Consumo mensal informado</b></td><td>${result.input.monthly_kwh} kWh/mês</td></tr>
      <tr><td><b>Estado de instalação</b></td><td>${result.input.state}</td></tr>
      <tr><td><b>Tipo de telhado</b></td><td>${result.input.roof_type}</td></tr>
      <tr><td><b>Irradiância solar local</b></td><td>${result.result.irradiance} kWh/m²/dia</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">⚡ Sistema Dimensionado</div>
    <table>
      <tr class="highlight"><td><b>Potência total do sistema</b></td><td><b>${result.result.system_power_kwp} kWp</b></td></tr>
      <tr><td>Número de painéis solares</td><td>${result.result.panel_count} painéis de ${result.result.panel_power_w}W</td></tr>
      <tr><td>Área de telhado necessária</td><td>${result.result.roof_area_m2} m²</td></tr>
      <tr><td>Geração anual estimada</td><td>${result.result.annual_generation_kwh.toLocaleString('pt-BR')} kWh/ano</td></tr>
      <tr><td>Geração mensal estimada</td><td>${Math.round(result.result.annual_generation_kwh/12).toLocaleString('pt-BR')} kWh/mês</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">💰 Análise Financeira</div>
    <table>
      <tr><td>Conta de luz atual estimada</td><td>R$ ${result.result.monthly_bill_estimate.toFixed(2)}/mês</td></tr>
      <tr><td>Economia mensal estimada</td><td>R$ ${(result.result.monthly_savings_cents/100).toFixed(2)}/mês</td></tr>
      <tr><td>Economia anual estimada</td><td>R$ ${(result.result.annual_savings_cents/100).toFixed(2)}/ano</td></tr>
      <tr class="highlight"><td><b>Investimento estimado</b></td><td><b>R$ ${(result.result.system_cost_cents/100).toLocaleString('pt-BR',{minimumFractionDigits:2})}</b></td></tr>
      <tr class="highlight"><td><b>Payback estimado</b></td><td><b>${result.result.payback_years ? result.result.payback_years + ' anos' : 'Solicitar orçamento personalizado'}</b></td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">🌱 Impacto Ambiental (25 anos de geração)</div>
    <table>
      <tr><td>CO₂ evitado por ano</td><td>${result.result.co2_saved_kg_year} kg de CO₂</td></tr>
      <tr><td>CO₂ evitado em 25 anos</td><td>${(result.result.co2_saved_kg_year * 25).toLocaleString('pt-BR')} kg de CO₂</td></tr>
      <tr><td>Equivalente a árvores plantadas</td><td>≈ ${Math.round(result.result.co2_saved_kg_year * 25 / 22)} árvores</td></tr>
    </table>
  </div>

  <div class="section">
    <div style="background:#FFF8E1;border:1px solid #FFB300;border-radius:8px;padding:14px;">
      <b>⚠️ Observações importantes:</b><br>
      <small>${result.disclaimer}</small>
    </div>
  </div>

  <div class="footer">
    <div>${storeName} • ${branding?.store_email ?? ''} • ${branding?.store_phone ?? ''}</div>
    <div>Proposta válida por 30 dias • Sujeita a avaliação técnica do local</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
}

export default function Simulator(_props: PageProps) {
    const { branding } = usePage<SharedProps>().props;
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SimulatorResult | null>(null);
    const [form, setForm] = useState({ monthly_kwh: '', state: '', roof_type: 'ceramic' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.monthly_kwh || Number(form.monthly_kwh) < 50) errs.monthly_kwh = 'Informe o consumo (mínimo 50 kWh)';
        if (!form.state) errs.state = 'Selecione seu estado';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const calculate = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await axios.post<SimulatorResult>('/api/simulator/calculate', form);
            setResult(res.data);
            setStep(2);
        } catch {
            setErrors({ general: 'Erro ao calcular. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <StorefrontLayout>
            <Head title="Simulador Solar — SolarHub Commerce" />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #0B5FFF 0%, #0040CC 100%)', color: 'white', py: 8 }}>
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    <SolarPowerIcon sx={{ fontSize: 64, color: '#FFB300', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Simulador Fotovoltaico</Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                        Calcule a economia e o sistema ideal para sua casa ou empresa
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: 6 }}>
                <Stepper activeStep={step} sx={{ mb: 6 }}>
                    {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                </Stepper>

                {errors.general && <Alert severity="error" sx={{ mb: 3 }}>{errors.general}</Alert>}

                {/* Step 0: Consumo */}
                {step === 0 && (
                    <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Qual é o seu consumo mensal?</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                            Encontre o valor em kWh na sua conta de energia elétrica.
                        </Typography>
                        <Stack spacing={3}>
                            <TextField
                                label="Consumo mensal (kWh)"
                                type="number"
                                value={form.monthly_kwh}
                                onChange={(e) => setForm({ ...form, monthly_kwh: e.target.value })}
                                error={!!errors.monthly_kwh}
                                helperText={errors.monthly_kwh ?? 'Geralmente entre 100 e 800 kWh para residências'}
                                fullWidth
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><BoltIcon color="warning" /></InputAdornment> } }}
                            />
                            <Box sx={{ bgcolor: 'primary.50', borderRadius: 2, p: 2.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>💡 Como encontrar na conta:</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Procure por "Consumo do Mês" ou "kWh" na sua fatura de energia. Se não souber, use o valor médio da sua região.
                                </Typography>
                            </Box>
                            <Button variant="contained" size="large" onClick={() => { if (form.monthly_kwh && Number(form.monthly_kwh) >= 50) { setErrors({}); setStep(1); } else { setErrors({ monthly_kwh: 'Informe um consumo válido (mín. 50 kWh)' }); } }} sx={{ py: 1.5, fontWeight: 700 }}>
                                Próximo →
                            </Button>
                        </Stack>
                    </Paper>
                )}

                {/* Step 1: Localização */}
                {step === 1 && (
                    <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Onde você está localizado?</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                            A irradiância solar varia por região e afeta a geração do sistema.
                        </Typography>
                        <Stack spacing={3}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={form.state}
                                    label="Estado"
                                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    error={!!errors.state}
                                >
                                    {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                                {errors.state && <Typography variant="caption" color="error">{errors.state}</Typography>}
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Tipo de telhado</InputLabel>
                                <Select value={form.roof_type} label="Tipo de telhado" onChange={(e) => setForm({ ...form, roof_type: e.target.value })}>
                                    <MenuItem value="ceramic">Cerâmico (telha colonial)</MenuItem>
                                    <MenuItem value="metal">Metálico (zinco, galvanizado)</MenuItem>
                                    <MenuItem value="slab">Laje</MenuItem>
                                    <MenuItem value="other">Outro</MenuItem>
                                </Select>
                            </FormControl>

                            <Stack direction="row" spacing={2}>
                                <Button variant="outlined" onClick={() => setStep(0)} sx={{ flex: 1 }}>← Voltar</Button>
                                <Button variant="contained" size="large" onClick={calculate} disabled={loading} sx={{ flex: 2, py: 1.5, fontWeight: 700 }} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CalculateIcon />}>
                                    {loading ? 'Calculando...' : 'Calcular Economia'}
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                )}

                {/* Step 2: Resultado */}
                {step === 2 && result && (
                    <Stack spacing={3}>
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                            Cálculo realizado com base na irradiância solar de {result.result.irradiance} kWh/m²/dia para {result.input.state}.
                        </Alert>

                        {/* KPIs principais */}
                        <Grid container spacing={2}>
                            {[
                                { icon: <AttachMoneyIcon />, label: 'Economia mensal estimada', value: formatBRL(result.result.monthly_savings_cents), color: 'success.main', bg: 'success.50' },
                                { icon: <AttachMoneyIcon />, label: 'Economia anual estimada', value: formatBRL(result.result.annual_savings_cents), color: 'primary.main', bg: 'primary.50' },
                                { icon: <SolarPowerIcon />, label: 'Potência do sistema', value: `${result.result.system_power_kwp} kWp`, color: 'warning.main', bg: 'warning.50' },
                                { icon: <Co2Icon />, label: 'CO₂ evitado por ano', value: `${result.result.co2_saved_kg_year} kg`, color: 'success.main', bg: 'success.50' },
                            ].map((stat) => (
                                <Grid key={stat.label} size={{ xs: 12, sm: 6 }}>
                                    <Paper elevation={0} sx={{ p: 3, bgcolor: stat.bg, borderRadius: 3, height: '100%' }}>
                                        <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color }}>{stat.value}</Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{stat.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Detalhes do sistema */}
                        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Detalhes do Sistema</Typography>
                            <Grid container spacing={2}>
                                {[
                                    ['Número de painéis', `${result.result.panel_count} painéis de ${result.result.panel_power_w}W`],
                                    ['Área de telhado necessária', `${result.result.roof_area_m2} m²`],
                                    ['Geração anual estimada', `${result.result.annual_generation_kwh.toLocaleString('pt-BR')} kWh`],
                                    ['Custo estimado do sistema', formatBRL(result.result.system_cost_cents)],
                                    ['Payback estimado', result.result.payback_years ? `${result.result.payback_years} anos` : 'Calcular com orçamento'],
                                    ['Conta mensal estimada', `R$ ${result.result.monthly_bill_estimate.toFixed(2)}`],
                                ].map(([label, value]) => (
                                    <Grid key={label} size={{ xs: 12, sm: 6 }}>
                                        <Stack direction="row" sx={{ justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
                                        </Stack>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>

                        {/* Kit sugerido */}
                        {result.suggested_kit && (
                            <Paper elevation={0} sx={{ p: 4, border: '2px solid', borderColor: 'primary.main', borderRadius: 3, bgcolor: 'primary.50' }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                                    <Box>
                                        <Chip label="Kit Sugerido" color="primary" size="small" sx={{ mb: 1 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{result.suggested_kit.name}</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
                                            {formatBRL(result.suggested_kit.price_cents)}
                                        </Typography>
                                    </Box>
                                    <Button
                                        component={Link as ElementType}
                                        href={`/produtos/${result.suggested_kit.slug}`}
                                        variant="contained"
                                        size="large"
                                        sx={{ flexShrink: 0, px: 4, py: 1.5, fontWeight: 700 }}
                                    >
                                        Ver Kit →
                                    </Button>
                                </Stack>
                            </Paper>
                        )}

                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2">{result.disclaimer}</Typography>
                        </Alert>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button variant="outlined" onClick={() => { setStep(0); setResult(null); setForm({ monthly_kwh: '', state: '', roof_type: 'ceramic' }); }} sx={{ flex: 1 }}>
                                Nova simulação
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={() => result && generateProposalPDF(result, branding ?? {})}
                                sx={{ flex: 1, fontWeight: 700 }}
                            >
                                Gerar Proposta PDF
                            </Button>
                            <Button component={Link as ElementType} href="/categorias/kits-fotovoltaicos" variant="contained" sx={{ flex: 2, fontWeight: 700 }}>
                                Ver kits solares
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Container>
        </StorefrontLayout>
    );
}
