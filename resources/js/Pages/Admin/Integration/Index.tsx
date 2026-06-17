import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import {
    Box, Grid, Paper, Typography, Stack, Chip, Button, Divider,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Alert, Tooltip, IconButton, Tab, Tabs, alpha, CircularProgress,
    Accordion, AccordionSummary, AccordionDetails, TextField, Snackbar,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';

interface Config {
    base_url: string;
    api_key_set: boolean;
    timeout: number;
    sync_enabled: boolean;
    gateway: string;
}

interface SyncLog {
    id: number;
    source: string;
    status: string;
    status_label: string;
    total_items: number;
    created_items: number;
    updated_items: number;
    error_items: number;
    archived_items: number;
    notes: string | null;
    errors: Record<string, unknown>[] | null;
    started_at: string | null;
    finished_at: string | null;
    duration_s: number | null;
}

interface Stats {
    total_syncs: number;
    success_rate: number;
    last_sync_at: string | null;
    last_status: string | null;
    products_synced: number;
}

interface AppSolarConfig {
    base_url: string;
    token_set: boolean;
    timeout: number;
    sync_enabled: boolean;
    full_sync_schedule: string;
    incremental_schedule: string;
}

interface AppSolarStats {
    total_syncs: number;
    success_rate: number;
    last_sync_at: string | null;
    last_status: string | null;
    kits_synced: number;
}

interface Props extends PageProps {
    config: Config;
    syncLogs: SyncLog[];
    stats: Stats;
    schema: Record<string, unknown>;
    appsolarConfig: AppSolarConfig;
    appsolarSyncLogs: SyncLog[];
    appsolarStats: AppSolarStats;
    envConfig: { payment_gateways: { value: string; label: string }[] };
}

const STATUS_COLOR: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    success: 'success',
    partial: 'warning',
    failed:  'error',
    running: 'info',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    success: <CheckCircleIcon sx={{ fontSize: 14 }} />,
    partial: <WarningIcon sx={{ fontSize: 14 }} />,
    failed:  <ErrorIcon sx={{ fontSize: 14 }} />,
    running: <SyncIcon sx={{ fontSize: 14 }} />,
};

function JsonViewer({ data, depth = 0 }: { data: unknown; depth?: number }) {
    const indent = depth * 20;

    if (data === null) return <Box component="span" sx={{ color: '#999' }}>null</Box>;
    if (typeof data === 'boolean') return <Box component="span" sx={{ color: '#569cd6' }}>{String(data)}</Box>;
    if (typeof data === 'number') return <Box component="span" sx={{ color: '#b5cea8' }}>{data}</Box>;
    if (typeof data === 'string') {
        if (data.startsWith('http')) {
            return <Box component="span" sx={{ color: '#ce9178' }}>"{data}"</Box>;
        }
        return <Box component="span" sx={{ color: '#ce9178' }}>"{data}"</Box>;
    }

    if (Array.isArray(data)) {
        return (
            <Box>
                <Box component="span" sx={{ color: '#d4d4d4' }}>{'['}</Box>
                {data.map((item, i) => (
                    <Box key={i} sx={{ ml: `${indent + 20}px` }}>
                        <JsonViewer data={item} depth={depth + 1} />
                        {i < data.length - 1 && <Box component="span" sx={{ color: '#d4d4d4' }}>,</Box>}
                    </Box>
                ))}
                <Box sx={{ ml: `${indent}px` }} component="span" sx={{ color: '#d4d4d4' }}>{'  ]'}</Box>
            </Box>
        );
    }

    if (typeof data === 'object') {
        const entries = Object.entries(data as Record<string, unknown>);
        return (
            <Box>
                <Box component="span" sx={{ color: '#d4d4d4' }}>{'{'}</Box>
                {entries.map(([key, value], i) => (
                    <Box key={key} sx={{ ml: `${indent + 16}px` }}>
                        <Box component="span" sx={{ color: '#9cdcfe' }}>"{key}"</Box>
                        <Box component="span" sx={{ color: '#d4d4d4' }}>: </Box>
                        <JsonViewer data={value} depth={depth + 1} />
                        {i < entries.length - 1 && <Box component="span" sx={{ color: '#d4d4d4' }}>,</Box>}
                    </Box>
                ))}
                <Box sx={{ ml: `${indent}px` }} component="span" sx={{ color: '#d4d4d4' }}>{'}'}</Box>
            </Box>
        );
    }

    return null;
}

export default function IntegrationIndex({ config, syncLogs, stats, schema, appsolarConfig, appsolarSyncLogs, appsolarStats, envConfig }: Props) {
    const [tab, setTab] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [testing, setTesting] = useState(false);
    const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [snackbar, setSnackbar] = useState<string | null>(null);
    const [appsolarSyncing, setAppsolarSyncing] = useState<'full' | 'incremental' | null>(null);
    const [appsolarSyncResult, setAppsolarSyncResult] = useState<{ success: boolean; message: string } | null>(null);
    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

    const runAppSolarSync = async (full: boolean) => {
        setAppsolarSyncing(full ? 'full' : 'incremental');
        setAppsolarSyncResult(null);
        try {
            const res = await fetch('/admin/integration/appsolar/sync', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ full }),
            });
            const data = await res.json();
            setAppsolarSyncResult(data);
            if (data.success) router.reload({ only: ['appsolarSyncLogs', 'appsolarStats'] });
        } catch {
            setAppsolarSyncResult({ success: false, message: 'Erro de comunicação com o servidor.' });
        } finally {
            setAppsolarSyncing(null);
        }
    };

    const isAppSolarConfigured = !!appsolarConfig.base_url && appsolarConfig.token_set;

    const runSync = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const res = await fetch('/admin/integration/sync', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            setSyncResult(data);
            if (data.success) router.reload({ only: ['syncLogs', 'stats'] });
        } catch {
            setSyncResult({ success: false, message: 'Erro de comunicação com o servidor.' });
        } finally {
            setSyncing(false);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/admin/integration/test-connection', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            setTestResult(data);
        } catch {
            setTestResult({ success: false, message: 'Erro ao testar conexão.' });
        } finally {
            setTesting(false);
        }
    };

    const copySchema = () => {
        navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
        setSnackbar('Schema copiado para a área de transferência!');
    };

    const isConfigured = !!config.base_url && config.api_key_set;

    return (
        <AdminLayout title="Integração / API ERP" breadcrumbs={[{ label: 'Integrações' }, { label: 'ERP / API Externa' }]}>
            <Head title="Integração ERP — Admin" />

            {/* Header */}
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 3, gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Integração ERP / API Externa</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Importe produtos, preços e estoque de um distribuidor ou ERP via API REST
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
                    <Button
                        variant="outlined"
                        startIcon={testing ? <CircularProgress size={14} /> : <LinkIcon />}
                        onClick={testConnection}
                        disabled={testing || !isConfigured}
                        size="small"
                    >
                        Testar Conexão
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
                        onClick={runSync}
                        disabled={syncing || !isConfigured}
                    >
                        {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                    </Button>
                </Stack>
            </Stack>

            {/* Alertas de resultado */}
            {testResult && (
                <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setTestResult(null)}>
                    {testResult.message}
                </Alert>
            )}
            {syncResult && (
                <Alert severity={syncResult.success ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setSyncResult(null)}>
                    {syncResult.message}
                </Alert>
            )}

            {/* Alerta configuração pendente */}
            {!isConfigured && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Integração não configurada</Typography>
                    <Typography variant="caption">
                        Configure as variáveis <code>ERP_BASE_URL</code> e <code>ERP_API_KEY</code> no arquivo <code>.env</code> para ativar a integração.
                    </Typography>
                </Alert>
            )}

            {/* KPIs */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                    {
                        icon: <InventoryIcon />,
                        label: 'Produtos Sincronizados',
                        value: String(stats.products_synced),
                        color: '#0B5FFF',
                        gradient: 'linear-gradient(135deg,#0B5FFF,#4D8DFF)',
                    },
                    {
                        icon: <SyncIcon />,
                        label: 'Total de Sincronizações',
                        value: String(stats.total_syncs),
                        color: '#7C3AED',
                        gradient: 'linear-gradient(135deg,#7C3AED,#A78BFA)',
                    },
                    {
                        icon: <BarChartIcon />,
                        label: 'Taxa de Sucesso',
                        value: `${stats.success_rate}%`,
                        color: '#059669',
                        gradient: 'linear-gradient(135deg,#059669,#34D399)',
                    },
                    {
                        icon: <AccessTimeIcon />,
                        label: 'Última Sincronização',
                        value: stats.last_sync_at ?? 'Nunca',
                        color: '#EA580C',
                        gradient: 'linear-gradient(135deg,#EA580C,#FB923C)',
                    },
                ].map((kpi) => (
                    <Grid key={kpi.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                        <Box sx={{
                            p: 2.5, borderRadius: 3, background: kpi.gradient,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <Box sx={{ position: 'absolute', right: -12, top: -12, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', mb: 1.5 }}>
                                {kpi.icon}
                            </Box>
                            <Typography sx={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>{kpi.value}</Typography>
                            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', mt: 0.4 }}>{kpi.label}</Typography>
                            {stats.last_status && kpi.label === 'Última Sincronização' && (
                                <Chip
                                    label={stats.last_status}
                                    size="small"
                                    color={STATUS_COLOR[stats.last_status] ?? 'default'}
                                    sx={{ mt: 1, height: 18, fontSize: 10 }}
                                />
                            )}
                        </Box>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', bgcolor: 'white' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab label="Status & Configuração" />
                        <Tab label="Histórico de Sincronizações" />
                        <Tab label="Schema JSON da API" />
                        <Tab label="Mapeamento de Campos" />
                        <Tab label="AppSolar (Edeltec)" />
                    </Tabs>
                </Box>

                {/* ── Tab 0: Status & Config ─────────────────────────────── */}
                {tab === 0 && (
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Status da Integração</Typography>
                                <Stack spacing={2}>
                                    {[
                                        { label: 'URL da API (ERP_BASE_URL)', value: config.base_url || '❌ Não configurado', ok: !!config.base_url },
                                        { label: 'Chave API (ERP_API_KEY)', value: config.api_key_set ? '✓ Configurada (oculta)' : '❌ Não configurada', ok: config.api_key_set },
                                        { label: 'Timeout', value: `${config.timeout}s`, ok: true },
                                        { label: 'Sync Automático', value: config.sync_enabled ? 'Habilitado (03:00 diário)' : 'Desabilitado (manual apenas)', ok: config.sync_enabled },
                                        { label: 'Gateway de Pagamento', value: config.gateway, ok: config.gateway !== 'mock' },
                                    ].map((item) => (
                                        <Stack key={item.label} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{item.label}</Typography>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ fontFamily: item.label.includes('URL') || item.label.includes('API') ? 'monospace' : 'inherit', fontSize: 13 }}>
                                                    {item.value}
                                                </Typography>
                                                {item.ok
                                                    ? <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                    : <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Como Configurar</Typography>
                                <Paper sx={{ bgcolor: '#1E1E1E', borderRadius: 2, p: 2.5, fontFamily: 'monospace', fontSize: 13, color: '#D4D4D4' }}>
                                    <Typography sx={{ color: '#6A9955', fontFamily: 'monospace', fontSize: 12, mb: 1 }}># Arquivo .env na raiz do projeto</Typography>
                                    {[
                                        { key: 'ERP_BASE_URL', val: 'https://api.seu-distribuidor.com.br', comment: '# URL base da API REST' },
                                        { key: 'ERP_API_KEY', val: 'sua_chave_secreta_aqui', comment: '# Chave de autenticação Bearer' },
                                        { key: 'ERP_TIMEOUT', val: '30', comment: '# Timeout em segundos' },
                                        { key: 'ERP_SYNC_ENABLED', val: 'true', comment: '# Habilita sync automático diário' },
                                        { key: '', val: '', comment: '' },
                                        { key: 'PAYMENT_GATEWAY', val: 'asaas', comment: '# mock | asaas' },
                                        { key: 'ASAAS_API_KEY', val: 'seu_api_key_asaas', comment: '# Chave do Asaas' },
                                        { key: 'ASAAS_ENVIRONMENT', val: 'sandbox', comment: '# sandbox | production' },
                                    ].map((line, i) => (
                                        <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                                            {line.key && (
                                                <>
                                                    <Box component="span" sx={{ color: '#9CDCFE' }}>{line.key}</Box>
                                                    <Box component="span" sx={{ color: '#D4D4D4' }}>=</Box>
                                                    <Box component="span" sx={{ color: '#CE9178' }}>{line.val}</Box>
                                                </>
                                            )}
                                            {line.comment && <Box component="span" sx={{ color: '#6A9955', ml: 1 }}>{line.comment}</Box>}
                                        </Box>
                                    ))}
                                </Paper>

                                <Alert severity="info" sx={{ mt: 2 }} icon={<SyncIcon />}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Após configurar o .env</Typography>
                                    <Typography variant="caption">
                                        Reinicie o servidor e rode o artisan: <code>php artisan config:cache</code>
                                    </Typography>
                                </Alert>

                                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        href="/admin/integration/schema"
                                        component="a"
                                        download
                                        startIcon={<DownloadIcon />}
                                        size="small"
                                    >
                                        Baixar Schema JSON
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        size="small"
                                        onClick={() => router.delete('/admin/integration/logs')}
                                    >
                                        Limpar Logs Antigos
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* ── Tab 1: Histórico ───────────────────────────────────── */}
                {tab === 1 && (
                    <Box>
                        {syncLogs.length === 0 ? (
                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                <SyncIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Nenhuma sincronização executada ainda.
                                </Typography>
                                <Button variant="contained" onClick={runSync} sx={{ mt: 2 }} disabled={!isConfigured}>
                                    Executar Primeira Sincronização
                                </Button>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                                            {['#', 'Status', 'Iniciado em', 'Duração', 'Total', 'Criados', 'Atualizados', 'Erros', ''].map((h) => (
                                                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 1 }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {syncLogs.map((log) => (
                                            <>
                                                <TableRow key={log.id} hover sx={{ '& td': { py: 1.5 } }}>
                                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>#{log.id}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={STATUS_ICON[log.status] as React.ReactElement}
                                                            label={log.status_label}
                                                            color={STATUS_COLOR[log.status] ?? 'default'}
                                                            size="small"
                                                            sx={{ fontWeight: 600, fontSize: 11 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 13 }}>{log.started_at ?? '—'}</TableCell>
                                                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                                                        {log.duration_s !== null ? `${log.duration_s}s` : '—'}
                                                    </TableCell>
                                                    <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 700 }}>{log.total_items}</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>{log.created_items}</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>{log.updated_items}</Typography></TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" sx={{ color: log.error_items > 0 ? 'error.main' : 'text.secondary', fontWeight: log.error_items > 0 ? 700 : 400 }}>
                                                            {log.error_items}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.errors && log.error_items > 0 && (
                                                            <Tooltip title="Ver erros">
                                                                <IconButton size="small" color="error" onClick={() => setTab(1)}>
                                                                    <ErrorIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                                {log.errors && log.error_items > 0 && (
                                                    <TableRow key={`err-${log.id}`}>
                                                        <TableCell colSpan={9} sx={{ py: 0, bgcolor: alpha('#DC2626', 0.03) }}>
                                                            <Box sx={{ p: 1.5 }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', display: 'block', mb: 0.5 }}>
                                                                    Erros desta sincronização:
                                                                </Typography>
                                                                <Box sx={{ fontFamily: 'monospace', fontSize: 11, color: 'error.dark', maxHeight: 120, overflow: 'auto' }}>
                                                                    {JSON.stringify(log.errors, null, 2)}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}

                {/* ── Tab 2: Schema JSON ────────────────────────────────── */}
                {tab === 2 && (
                    <Box sx={{ p: 3 }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Schema JSON da API de Integração</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Formato esperado da API REST do seu distribuidor/ERP
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copySchema}>
                                    Copiar
                                </Button>
                                <Button size="small" variant="contained" startIcon={<DownloadIcon />} href="/admin/integration/schema" component="a" download>
                                    Baixar .json
                                </Button>
                            </Stack>
                        </Stack>

                        {/* Seções do schema */}
                        {[
                            { key: 'endpoints',          title: '📡 Endpoints da API', description: 'Rotas HTTP que a plataforma vai consumir' },
                            { key: 'field_mapping',      title: '🔗 Mapeamento de Campos', description: 'Como os campos externos são mapeados para o SolarHub' },
                            { key: 'example_response',   title: '📦 Exemplo de Resposta', description: 'Exemplo real do JSON retornado pelo endpoint /products' },
                            { key: 'webhook_optional',   title: '🔔 Webhook (opcional)', description: 'O distribuidor pode notificar o SolarHub sobre atualizações' },
                            { key: 'auth',               title: '🔑 Autenticação', description: 'Como a autenticação deve ser feita' },
                        ].map((section) => (
                            <Accordion key={section.key} defaultExpanded={section.key === 'example_response'} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 3 }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{section.title}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{section.description}</Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                    <Box sx={{
                                        bgcolor: '#1E1E1E', borderRadius: 2, p: 2.5,
                                        fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8,
                                        overflow: 'auto', maxHeight: 400,
                                    }}>
                                        <JsonViewer data={(schema as Record<string, unknown>)[section.key]} />
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}

                {/* ── Tab 3: Mapeamento de Campos ──────────────────────── */}
                {tab === 3 && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Mapeamento de Campos</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Como cada campo da API externa é interpretado e armazenado na plataforma SolarHub Commerce
                        </Typography>

                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                                        {['Campo Externo (API)', 'Campo Interno (SolarHub)', 'Obrigatório', 'Tipo', 'Conversão'].map((h) => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[
                                        { external: 'id / codigo / sku', internal: 'external_id', required: true,  type: 'string',  conversion: 'Direto (string)' },
                                        { external: 'sku / codigo / part_number', internal: 'sku', required: true, type: 'string', conversion: 'Direto (string)' },
                                        { external: 'name / nome / descricao', internal: 'name', required: true, type: 'string', conversion: 'Direto (string)' },
                                        { external: 'price / preco / valor', internal: 'price_cents', required: true, type: 'number', conversion: 'float × 100 ou int direto' },
                                        { external: 'compare_price / preco_de', internal: 'compare_at_price_cents', required: false, type: 'number|null', conversion: 'float × 100 ou null' },
                                        { external: 'cost / custo', internal: 'cost_cents', required: false, type: 'number|null', conversion: 'float × 100 ou null' },
                                        { external: 'stock / estoque / quantidade', internal: 'quantity_available', required: true, type: 'integer', conversion: 'Direto (int)' },
                                        { external: 'weight / peso', internal: 'weight_grams', required: false, type: 'float', conversion: 'kg × 1000 = gramas' },
                                        { external: 'description / descricao_completa', internal: 'description', required: false, type: 'string|null', conversion: 'HTML ou texto puro' },
                                        { external: 'image_url / imagem', internal: 'cover_image URL', required: false, type: 'string|null', conversion: 'URL direta ou download' },
                                        { external: 'specifications / specs', internal: 'specifications (JSON)', required: false, type: 'object', conversion: 'Chave-valor técnico' },
                                        { external: 'active / ativo', internal: 'status = published/draft', required: false, type: 'boolean', conversion: 'true = Publicado' },
                                        { external: 'brand / marca / fabricante', internal: 'brand (nome)', required: false, type: 'string|null', conversion: 'Busca ou cria Brand' },
                                        { external: 'category / categoria', internal: 'category (nome)', required: false, type: 'string|null', conversion: 'Busca por nome' },
                                    ].map((row) => (
                                        <TableRow key={row.external} hover>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: '#0B5FFF' }}>{row.external}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.internal}</TableCell>
                                            <TableCell>
                                                <Chip label={row.required ? 'Sim' : 'Não'} size="small" color={row.required ? 'error' : 'default'} sx={{ fontSize: 10, height: 18 }} />
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{row.type}</TableCell>
                                            <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{row.conversion}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Alert severity="info" sx={{ mt: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Adaptando para sua API</Typography>
                            <Typography variant="caption">
                                Edite o método <code>mapProduct()</code> em <code>app/Domains/Integrations/Services/HttpErpClient.php</code> para ajustar
                                os nomes dos campos ao formato exato da sua API de distribuidor.
                            </Typography>
                        </Alert>
                    </Box>
                )}

                {/* ── Tab 4: AppSolar (Edeltec) ──────────────────────────── */}
                {tab === 4 && (
                    <Box sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 3, gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Catálogo AppSolar (Distribuidor Edeltec)</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Sincroniza os kits fotovoltaicos da Edeltec via API do AppSolar. Todos os campos retornados pela API são importados.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={appsolarSyncing === 'incremental' ? <CircularProgress size={14} /> : <SyncIcon />}
                                    onClick={() => runAppSolarSync(false)}
                                    disabled={appsolarSyncing !== null || !isAppSolarConfigured}
                                    size="small"
                                >
                                    Sincronizar Incremental
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={appsolarSyncing === 'full' ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
                                    onClick={() => runAppSolarSync(true)}
                                    disabled={appsolarSyncing !== null || !isAppSolarConfigured}
                                    size="small"
                                >
                                    Sincronizar Completo
                                </Button>
                            </Stack>
                        </Stack>

                        {appsolarSyncResult && (
                            <Alert severity={appsolarSyncResult.success ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setAppsolarSyncResult(null)}>
                                {appsolarSyncResult.message}
                            </Alert>
                        )}

                        {!isAppSolarConfigured && (
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Integração AppSolar não configurada</Typography>
                                <Typography variant="caption">
                                    Configure <code>APPSOLAR_API_BASE_URL</code> e <code>APPSOLAR_API_TOKEN</code> no <code>.env</code> para ativar a sincronização.
                                </Typography>
                            </Alert>
                        )}

                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            {[
                                { label: 'Kits Sincronizados', value: String(appsolarStats.kits_synced), color: '#0B5FFF' },
                                { label: 'Total de Sincronizações', value: String(appsolarStats.total_syncs), color: '#7C3AED' },
                                { label: 'Taxa de Sucesso', value: `${appsolarStats.success_rate}%`, color: '#059669' },
                                { label: 'Última Sincronização', value: appsolarStats.last_sync_at ?? 'Nunca', color: '#EA580C' },
                            ].map((kpi) => (
                                <Grid key={kpi.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                                    <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</Typography>
                                        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.3 }}>{kpi.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Stack spacing={1.5}>
                                    {[
                                        { label: 'URL da API (APPSOLAR_API_BASE_URL)', value: appsolarConfig.base_url || '❌ Não configurado', ok: !!appsolarConfig.base_url },
                                        { label: 'Token (APPSOLAR_API_TOKEN)', value: appsolarConfig.token_set ? '✓ Configurado (oculto)' : '❌ Não configurado', ok: appsolarConfig.token_set },
                                        { label: 'Sync Completo', value: appsolarConfig.full_sync_schedule, ok: true },
                                        { label: 'Sync Incremental', value: appsolarConfig.incremental_schedule, ok: true },
                                    ].map((item) => (
                                        <Stack key={item.label} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{item.label}</Typography>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 13 }}>{item.value}</Typography>
                                                {item.ok
                                                    ? <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                    : <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>

                        {appsolarSyncLogs.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <SyncIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Nenhuma sincronização com o AppSolar executada ainda.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                                            {['#', 'Status', 'Iniciado em', 'Duração', 'Total', 'Criados', 'Atualizados', 'Arquivados', 'Erros'].map((h) => (
                                                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 1 }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {appsolarSyncLogs.map((log) => (
                                            <TableRow key={log.id} hover sx={{ '& td': { py: 1.5 } }}>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>#{log.id}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={STATUS_ICON[log.status] as React.ReactElement}
                                                        label={log.status_label}
                                                        color={STATUS_COLOR[log.status] ?? 'default'}
                                                        size="small"
                                                        sx={{ fontWeight: 600, fontSize: 11 }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 13 }}>
                                                    {log.started_at ?? '—'}
                                                    {log.notes && (
                                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{log.notes}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                                                    {log.duration_s !== null ? `${log.duration_s}s` : '—'}
                                                </TableCell>
                                                <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 700 }}>{log.total_items}</Typography></TableCell>
                                                <TableCell align="center"><Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>{log.created_items}</Typography></TableCell>
                                                <TableCell align="center"><Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>{log.updated_items}</Typography></TableCell>
                                                <TableCell align="center"><Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{log.archived_items}</Typography></TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" sx={{ color: log.error_items > 0 ? 'error.main' : 'text.secondary', fontWeight: log.error_items > 0 ? 700 : 400 }}>
                                                        {log.error_items}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
            </Paper>

            <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
        </AdminLayout>
    );
}
