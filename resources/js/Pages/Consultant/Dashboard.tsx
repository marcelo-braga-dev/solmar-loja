import { Head, Link } from '@inertiajs/react';
import { type ElementType } from 'react';
import {
    Box, Grid, Paper, Stack, Typography, Chip, Avatar, LinearProgress,
    Divider, Button, alpha,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ConsultantLayout from '@/Layouts/ConsultantLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface Stats {
    draft: number;
    sent: number;
    accepted: number;
    total: number;
    conversion_rate: number;
    revenue_this_month: number;
    revenue_last_month: number;
    monthly_goal: number;
    goal_progress: number;
    commission_earned: number;
}

interface RecentProposal {
    uuid: string;
    reference: string;
    title: string;
    customer_name: string;
    customer_city: string | null;
    status: string;
    status_label: string;
    status_color: string;
    total_cents: number;
    valid_until: string | null;
    created_at: string;
}

interface Props extends PageProps {
    consultant: { name: string; email: string; region: string | null; commission_pct: number; price_list: string };
    stats: Stats;
    recent_proposals: RecentProposal[];
}

const STATUS_COLORS: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    default: 'default', success: 'success', error: 'error', warning: 'warning', info: 'info', primary: 'primary',
};

function KpiCard({ label, value, sub, gradient, icon, growth }: { label: string; value: string; sub?: string; gradient: string; icon: React.ReactNode; growth?: number | null }) {
    return (
        <Box sx={{ p: 2.5, borderRadius: 3, background: gradient, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', right: -12, top: -12, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{icon}</Box>
                {growth !== undefined && growth !== null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, bgcolor: growth >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,80,80,0.3)', color: 'white', borderRadius: 5, px: 0.9, py: 0.3, fontSize: 12, fontWeight: 700 }}>
                        {growth >= 0 ? <TrendingUpIcon sx={{ fontSize: 13 }} /> : <TrendingDownIcon sx={{ fontSize: 13 }} />}
                        {growth >= 0 ? '+' : ''}{growth}%
                    </Box>
                )}
            </Stack>
            <Typography sx={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1 }}>{value}</Typography>
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', mt: 0.3 }}>{label}</Typography>
            {sub && <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', mt: 0.2 }}>{sub}</Typography>}
        </Box>
    );
}

export default function ConsultantDashboard({ consultant, stats, recent_proposals }: Props) {
    const revenueGrowth = stats.revenue_last_month > 0
        ? Math.round((stats.revenue_this_month - stats.revenue_last_month) / stats.revenue_last_month * 100)
        : null;

    return (
        <ConsultantLayout title="Dashboard">
            <Head title="Painel — Consultor" />

            {/* Welcome */}
            <Box sx={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1E3A6E 60%, #0B5FFF 100%)', borderRadius: 3, p: { xs: 2.5, md: 3 }, mb: 3, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(11,95,255,0.2)' }}>
                <Box sx={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, position: 'relative' }}>
                    <Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, mb: 0.3 }}>Bem-vindo,</Typography>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2 }}>{consultant.name} 👋</Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.8 }}>
                            <Chip label={`Tabela: ${consultant.price_list}`} size="small" sx={{ bgcolor: 'rgba(255,179,0,0.2)', color: '#FFD54F', fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,179,0,0.3)' }} />
                            <Chip label={`Comissão: ${consultant.commission_pct}%`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 11 }} />
                            {consultant.region && <Chip label={consultant.region} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11 }} />}
                        </Stack>
                    </Box>
                    <Button
                        component={Link as ElementType}
                        href="/consultor/propostas/criar"
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 700, boxShadow: '0 4px 16px rgba(255,179,0,0.4)', '&:hover': { bgcolor: '#e6a200' }, flexShrink: 0 }}
                    >
                        Nova Proposta
                    </Button>
                </Stack>
            </Box>

            {/* KPIs */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <KpiCard label="Receita do Mês" value={formatBRL(stats.revenue_this_month)} sub={`Mês anterior: ${formatBRL(stats.revenue_last_month)}`} growth={revenueGrowth} gradient="linear-gradient(135deg,#0B5FFF,#0040CC)" icon={<AttachMoneyIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <KpiCard label="Comissão Estimada" value={formatBRL(stats.commission_earned)} sub={`${consultant.commission_pct}% sobre vendas aceitas`} gradient="linear-gradient(135deg,#059669,#047857)" icon={<AttachMoneyIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <KpiCard label="Propostas Aceitas" value={String(stats.accepted)} sub={`${stats.total} total`} gradient="linear-gradient(135deg,#7C3AED,#5B21B6)" icon={<CheckCircleIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <KpiCard label="Taxa de Conversão" value={`${stats.conversion_rate}%`} sub={`${stats.sent} em aberto`} gradient="linear-gradient(135deg,#EA580C,#C2410C)" icon={<DescriptionIcon />} />
                </Grid>
            </Grid>

            <Grid container spacing={2.5}>
                {/* Propostas recentes */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', bgcolor: '#FAFAFA' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Minhas Propostas Recentes</Typography>
                            <Box component={Link as ElementType} href="/consultor/propostas" sx={{ fontSize: 13, color: 'primary.main', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Ver todas <ArrowForwardIcon sx={{ fontSize: 14 }} />
                            </Box>
                        </Box>
                        {recent_proposals.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <DescriptionIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma proposta criada ainda.</Typography>
                                <Button component={Link as ElementType} href="/consultor/propostas/criar" variant="contained" size="small" sx={{ mt: 2 }}>
                                    Criar primeira proposta
                                </Button>
                            </Box>
                        ) : (
                            <Box>
                                {recent_proposals.map((p, i) => (
                                    <Box
                                        key={p.uuid}
                                        component={Link as ElementType}
                                        href={`/consultor/propostas/${p.uuid}`}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.8, textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: '#F8FAFF' }, borderBottom: i < recent_proposals.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', transition: 'bgcolor 0.1s' }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'primary.main', lineHeight: 1 }}>{p.reference}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{p.customer_name}</Typography>
                                            {p.customer_city && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.customer_city}</Typography>}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }} noWrap>{p.title}</Typography>
                                        </Box>
                                        <Chip label={p.status_label} color={STATUS_COLORS[p.status_color] ?? 'default'} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
                                        <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: 14, flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
                                            {formatBRL(p.total_cents)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0, display: { xs: 'none', md: 'block' } }}>{p.created_at}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Sidebar direita */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={2.5}>
                        {/* Meta mensal */}
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>🎯 Meta Mensal</Typography>
                            {stats.monthly_goal > 0 ? (
                                <>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Progresso</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: stats.goal_progress >= 100 ? 'success.main' : 'primary.main' }}>
                                            {stats.goal_progress}%
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={stats.goal_progress}
                                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: stats.goal_progress >= 100 ? 'success.main' : 'primary.main' } }}
                                    />
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Realizado</Typography>
                                            <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>{formatBRL(stats.revenue_this_month)}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Meta</Typography>
                                            <Typography sx={{ fontWeight: 700 }}>{formatBRL(stats.monthly_goal)}</Typography>
                                        </Box>
                                    </Stack>
                                </>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>Meta não configurada. Contate o administrador.</Typography>
                            )}
                        </Paper>

                        {/* Status das propostas */}
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>📊 Status das Propostas</Typography>
                            <Stack spacing={1.5}>
                                {[
                                    { label: 'Rascunho',   value: stats.draft,    color: '#6B7280' },
                                    { label: 'Enviadas',   value: stats.sent,     color: '#0284C7' },
                                    { label: 'Aceitas',    value: stats.accepted, color: '#059669' },
                                ].map((s) => {
                                    const pct = stats.total > 0 ? Math.round(s.value / stats.total * 100) : 0;
                                    return (
                                        <Box key={s.label}>
                                            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontSize: 13 }}>{s.label}</Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{pct}%</Typography>
                                                </Stack>
                                            </Stack>
                                            <Box sx={{ height: 5, borderRadius: 3, bgcolor: alpha(s.color, 0.12) }}>
                                                <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 3, bgcolor: s.color, transition: 'width 0.6s ease' }} />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </ConsultantLayout>
    );
}
