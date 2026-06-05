import { Head, Link } from '@inertiajs/react';
import { type ElementType, useState } from 'react';
import {
    Box, Grid, Paper, Typography, Stack, Chip, Avatar,
    Table, TableBody, TableCell, TableHead, TableRow,
    ButtonBase, Divider, alpha, Tab, Tabs, Button, Select, MenuItem, FormControl,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddBoxIcon from '@mui/icons-material/AddBox';
import BarChartIcon from '@mui/icons-material/BarChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DownloadIcon from '@mui/icons-material/Download';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface Stats {
    revenue_this_month: number;
    revenue_last_month: number;
    revenue_growth: number | null;
    orders_this_month: number;
    orders_today: number;
    total_products: number;
    total_customers: number;
    orders_by_status: Record<string, number>;
    revenue_sparkline: number[];
    pending_orders: number;
    low_stock_count: number;
    new_customers_7d: number;
}

interface ChartPoint { date: string; revenue?: number; orders?: number; count?: number }
interface CategoryRevenue { name: string; value: number }
interface TopProduct { name: string; uuid: string; qty: number; revenue: number }

interface RecentOrder {
    uuid: string;
    status: string;
    status_label: string;
    status_color: string;
    total_cents: number;
    customer: string;
    placed_at: string;
}

interface Props extends PageProps {
    stats: Stats;
    revenueChart: ChartPoint[];
    customerChart: ChartPoint[];
    revenueByCategory: CategoryRevenue[];
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#F59E0B', awaiting_payment: '#F59E0B',
    paid: '#0284C7', processing: '#7C3AED',
    shipped: '#0B5FFF', delivered: '#16A34A',
    canceled: '#DC2626', refunded: '#6B7280',
};

const STATUS_LABEL_MAP: Record<string, string> = {
    pending: 'Aguardando', awaiting_payment: 'Ag. Pagamento',
    paid: 'Pago', processing: 'Em processamento',
    shipped: 'Enviado', delivered: 'Entregue',
    canceled: 'Cancelado', refunded: 'Reembolsado',
};

const PIE_COLORS = ['#0B5FFF', '#7C3AED', '#059669', '#EA580C', '#F59E0B'];

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

// Tooltip customizado para o gráfico de receita
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, p: 1.5, boxShadow: 3 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBRL(payload[0]?.value ?? 0)}</Typography>
            {payload[1] && (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{payload[1].value} pedidos</Typography>
            )}
        </Box>
    );
}

interface KpiCardProps {
    label: string;
    value: string;
    sub?: string;
    growth?: number | null;
    gradient: string;
    icon: React.ReactNode;
    sparkline?: number[];
    href?: string;
}

function Sparkline({ data, color = 'rgba(255,255,255,0.7)', height = 40 }: { data: number[]; color?: string; height?: number }) {
    if (data.length < 2) return null;
    const max = Math.max(...data, 1);
    const w = 100;
    const h = height;
    const step = w / (data.length - 1);
    const points = data.map((v, i) => `${i * step},${h - (v / max) * h * 0.85}`).join(' ');
    return (
        <svg width={w} height={h} style={{ overflow: 'visible' }}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function KpiCard({ label, value, sub, growth, gradient, icon, sparkline, href }: KpiCardProps) {
    const content = (
        <Box sx={{
            p: 2.5, height: '100%',
            background: gradient,
            borderRadius: 3,
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 150,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': href ? { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0,0,0,0.18)' } : {},
        }}>
            <Box sx={{ position: 'absolute', right: -16, top: -16, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {icon}
                </Box>
                {growth !== undefined && growth !== null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: growth >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,100,100,0.3)', color: 'white', borderRadius: 5, px: 1, py: 0.3, fontSize: 12, fontWeight: 700 }}>
                        {growth >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                        {growth >= 0 ? '+' : ''}{growth}%
                    </Box>
                )}
            </Box>
            <Box sx={{ position: 'relative' }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1.1, mb: 0.3 }}>{value}</Typography>
                <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{label}</Typography>
                {sub && <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', mt: 0.3 }}>{sub}</Typography>}
            </Box>
            {sparkline && sparkline.length > 1 && (
                <Box sx={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.5 }}>
                    <Sparkline data={sparkline} />
                </Box>
            )}
        </Box>
    );
    if (href) {
        return (
            <ButtonBase component={Link as ElementType} href={href} sx={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: 3 }}>
                {content}
            </ButtonBase>
        );
    }
    return content;
}

// Exportar para CSV via frontend
function exportCSV(data: TopProduct[], filename: string) {
    const headers = ['Produto', 'Qtd. Vendida', 'Receita'];
    const rows = data.map(p => [p.name, p.qty, (p.revenue / 100).toFixed(2)]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

export default function Dashboard({ stats, revenueChart, customerChart, revenueByCategory, topProducts, recentOrders }: Props) {
    const [chartTab, setChartTab] = useState(0);
    const totalOrdersByStatus = Object.values(stats.orders_by_status).reduce((a, b) => a + b, 0);

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard — Admin" />

            {/* Welcome banner */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0D1B3E 0%, #0B5FFF 60%, #4D8DFF 100%)',
                borderRadius: 3, p: { xs: 2.5, md: 3 }, mb: 3,
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(11,95,255,0.25)',
            }}>
                <Box sx={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, position: 'relative' }}>
                    <Box>
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <WbSunnyIcon sx={{ color: '#FFB300', fontSize: 20 }} />
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>{getGreeting()}!</Typography>
                        </Stack>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>
                            Painel SolarHub Commerce
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                    <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap' }}>
                        {stats.pending_orders > 0 && (
                            <Box component={Link as ElementType} href="/admin/orders" sx={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,179,0,0.2)', border: '1px solid rgba(255,179,0,0.4)', borderRadius: 2, px: 2, py: 1, '&:hover': { bgcolor: 'rgba(255,179,0,0.3)' } }}>
                                <WarningAmberIcon sx={{ color: '#FFB300', fontSize: 18 }} />
                                <Typography sx={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{stats.pending_orders} pedido{stats.pending_orders !== 1 ? 's' : ''} pendente{stats.pending_orders !== 1 ? 's' : ''}</Typography>
                            </Box>
                        )}
                        {stats.low_stock_count > 0 && (
                            <Box component={Link as ElementType} href="/admin/inventory" sx={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 2, px: 2, py: 1, '&:hover': { bgcolor: 'rgba(220,38,38,0.3)' } }}>
                                <InventoryIcon sx={{ color: '#FCA5A5', fontSize: 18 }} />
                                <Typography sx={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{stats.low_stock_count} produto{stats.low_stock_count !== 1 ? 's' : ''} com estoque baixo</Typography>
                            </Box>
                        )}
                        <Box component={Link as ElementType} href="/admin/reports" sx={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2, px: 2, py: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                            <BarChartIcon sx={{ color: 'white', fontSize: 18 }} />
                            <Typography sx={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Relatórios</Typography>
                        </Box>
                    </Stack>
                </Stack>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <KpiCard icon={<AttachMoneyIcon />} label="Receita do mês" value={formatBRL(stats.revenue_this_month)} sub={`Mês anterior: ${formatBRL(stats.revenue_last_month)}`} growth={stats.revenue_growth} gradient="linear-gradient(135deg,#0B5FFF 0%,#0040CC 100%)" sparkline={stats.revenue_sparkline} href="/admin/reports" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <KpiCard icon={<ShoppingCartIcon />} label="Pedidos este mês" value={String(stats.orders_this_month)} sub={`${stats.orders_today} hoje`} gradient="linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%)" href="/admin/orders" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <KpiCard icon={<InventoryIcon />} label="Produtos publicados" value={String(stats.total_products)} sub="no catálogo" gradient="linear-gradient(135deg,#059669 0%,#047857 100%)" href="/admin/products" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <KpiCard icon={<PeopleIcon />} label="Clientes cadastrados" value={String(stats.total_customers)} sub={`+${stats.new_customers_7d} nos últimos 7 dias`} gradient="linear-gradient(135deg,#EA580C 0%,#C2410C 100%)" href="/admin/customers" />
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, bgcolor: 'white' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>Ações Rápidas</Typography>
                <Grid container spacing={1.5}>
                    {[
                        { icon: <AddBoxIcon fontSize="small" />, label: 'Novo Produto', href: '/admin/products/create', color: '#0B5FFF' },
                        { icon: <ShoppingCartIcon fontSize="small" />, label: 'Ver Pedidos', href: '/admin/orders', color: '#7C3AED' },
                        { icon: <LocalShippingIcon fontSize="small" />, label: 'Estoque', href: '/admin/inventory', color: '#059669' },
                        { icon: <ConfirmationNumberIcon fontSize="small" />, label: 'Cupons', href: '/admin/coupons', color: '#EA580C' },
                        { icon: <StarIcon fontSize="small" />, label: 'Avaliações', href: '/admin/reviews', color: '#F59E0B' },
                        { icon: <BarChartIcon fontSize="small" />, label: 'Relatórios', href: '/admin/reports', color: '#0284C7' },
                    ].map((action) => (
                        <Grid key={action.href} size={{ xs: 4, sm: 2 }}>
                            <ButtonBase component={Link as ElementType} href={action.href} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 2, borderRadius: 2.5, width: '100%', bgcolor: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.15s', '&:hover': { bgcolor: alpha(action.color, 0.06), borderColor: alpha(action.color, 0.3), transform: 'translateY(-1px)', boxShadow: `0 4px 16px ${alpha(action.color, 0.15)}` } }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha(action.color, 0.1), color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {action.icon}
                                </Box>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textAlign: 'center', lineHeight: 1.2 }}>{action.label}</Typography>
                            </ButtonBase>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Gráfico de Receita / Clientes */}
            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, bgcolor: 'white' }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Desempenho — Últimos 30 dias</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Receita e pedidos diários</Typography>
                            </Box>
                            <Tabs value={chartTab} onChange={(_, v) => setChartTab(v)} sx={{ '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 12 } }}>
                                <Tab label="Receita" />
                                <Tab label="Clientes" />
                            </Tabs>
                        </Stack>
                        <Box sx={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {chartTab === 0 ? (
                                    <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0B5FFF" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0B5FFF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`} width={60} />
                                        <Tooltip content={<RevenueTooltip />} />
                                        <Area type="monotone" dataKey="revenue" stroke="#0B5FFF" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#0B5FFF' }} />
                                    </AreaChart>
                                ) : (
                                    <BarChart data={customerChart} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#EA580C" name="Novos clientes" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Receita por Categoria */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, bgcolor: 'white', height: '100%' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Receita por Categoria</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Mês atual</Typography>
                        {revenueByCategory.length === 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Sem dados este mês</Typography>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ height: 180 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={revenueByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                                                {revenueByCategory.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => formatBRL(v)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Stack spacing={0.8} sx={{ mt: 1 }}>
                                    {revenueByCategory.map((c, i) => (
                                        <Stack key={c.name} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{c.name}</Typography>
                                            </Stack>
                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatBRL(c.value)}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom row */}
            <Grid container spacing={2.5}>
                {/* Pedidos recentes */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', bgcolor: 'white', height: '100%' }}>
                        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1 }}>Pedidos Recentes</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Últimos {recentOrders.length} pedidos</Typography>
                            </Box>
                            <Box component={Link as ElementType} href="/admin/orders" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                                Ver todos <ArrowForwardIcon sx={{ fontSize: 14 }} />
                            </Box>
                        </Box>
                        {recentOrders.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <ShoppingCartIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhum pedido ainda.</Typography>
                            </Box>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {['Cliente', 'Status', 'Total', 'Quando'].map((h, i) => (
                                            <TableCell key={h} align={i >= 2 ? 'right' : 'left'} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, bgcolor: '#FAFAFA', py: 1 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentOrders.map((order) => (
                                        <TableRow key={order.uuid} component={Link as ElementType} href={`/admin/orders/${order.uuid}`} sx={{ textDecoration: 'none', cursor: 'pointer', '&:last-child td': { border: 0 }, '&:hover': { bgcolor: '#F8FAFF' }, transition: 'bgcolor 0.1s' }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: alpha('#0B5FFF', 0.1), color: '#0B5FFF' }}>
                                                        {order.customer[0]?.toUpperCase() ?? '?'}
                                                    </Avatar>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{order.customer}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip label={order.status_label} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: alpha(STATUS_COLORS[order.status] ?? '#6B7280', 0.1), color: STATUS_COLORS[order.status] ?? '#6B7280', border: 'none' }} />
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(order.total_cents)}</Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{order.placed_at}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Paper>
                </Grid>

                {/* Coluna direita */}
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Stack spacing={2.5}>
                        {/* Top Produtos */}
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, bgcolor: 'white' }}>
                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1 }}>Top Produtos</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Mais vendidos do mês</Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => exportCSV(topProducts, `top-produtos-${new Date().toISOString().slice(0, 10)}.csv`)}
                                    sx={{ fontSize: 12 }}
                                >
                                    CSV
                                </Button>
                            </Stack>
                            {topProducts.length === 0 ? (
                                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>Sem dados este mês.</Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {topProducts.slice(0, 5).map((p, i) => {
                                        const maxRev = topProducts[0]?.revenue ?? 1;
                                        const pct = Math.round((p.revenue / maxRev) * 100);
                                        return (
                                            <Box key={p.uuid}>
                                                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.4 }}>
                                                    <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', minWidth: 0 }}>
                                                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.disabled', minWidth: 16 }}>#{i + 1}</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{p.name}</Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                                                        <Chip label={`${p.qty} un.`} size="small" sx={{ height: 18, fontSize: 10 }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', minWidth: 80, textAlign: 'right' }}>{formatBRL(p.revenue)}</Typography>
                                                    </Stack>
                                                </Stack>
                                                <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)' }}>
                                                    <Box sx={{ height: '100%', borderRadius: 2, bgcolor: 'primary.main', width: `${pct}%`, transition: 'width 0.6s ease' }} />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Paper>

                        {/* Status dos Pedidos */}
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, bgcolor: 'white' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1 }}>Status dos Pedidos</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Mês atual</Typography>
                            {Object.entries(stats.orders_by_status).length === 0 ? (
                                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>Sem dados este mês.</Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {Object.entries(stats.orders_by_status).sort(([, a], [, b]) => b - a).map(([status, count]) => {
                                        const pct = totalOrdersByStatus > 0 ? Math.round((count / totalOrdersByStatus) * 100) : 0;
                                        const color = STATUS_COLORS[status] ?? '#6B7280';
                                        return (
                                            <Box key={status}>
                                                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>{STATUS_LABEL_MAP[status] ?? status}</Typography>
                                                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color }}>{count}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{pct}%</Typography>
                                                    </Stack>
                                                </Stack>
                                                <Box sx={{ height: 5, borderRadius: 3, bgcolor: alpha(color, 0.12) }}>
                                                    <Box sx={{ height: '100%', borderRadius: 3, bgcolor: color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </AdminLayout>
    );
}
