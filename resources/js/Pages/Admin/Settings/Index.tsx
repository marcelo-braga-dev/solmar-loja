import { Head, router, Link } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, Grid, IconButton, InputAdornment, Link as MuiLink, Paper, Stack,
    Switch, FormControlLabel, TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PaletteIcon from '@mui/icons-material/Palette';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CircularProgress from '@mui/material/CircularProgress';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';
import { useState } from 'react';
import { maskPhone, maskCnpj } from '@/Lib/masks';

interface SettingItem {
    id: number;
    key: string;
    value: string | null;
    type: string;
    label: string;
    description?: string | null;
}

interface Props extends PageProps {
    groups: Record<string, SettingItem[]>;
}

// Grupos gerenciados pela página de Identidade Visual — não aparecem aqui
const BRANDING_GROUPS = ['branding', 'social'];

const GROUP_LABELS: Record<string, string> = {
    general:      'Dados da Empresa',
    payment:      'Pagamentos',
    shipping:     'Frete',
    seo:          'SEO e Analytics',
    social_login: 'Login com Conta Google',
};

const PLACEHOLDERS: Record<string, string> = {
    store_name:              'Ex.: Minha Loja Solar',
    store_email:             'Ex.: contato@minhaloja.com.br',
    store_phone:             'Ex.: (11) 3000-0000',
    store_cnpj:              'Ex.: 00.000.000/0001-00',
    store_address:           'Ex.: Rua das Flores, 123 — São Paulo, SP',
    store_tagline:           'Ex.: Energia solar para todos',
    store_description:       'Breve descrição que aparece no rodapé e SEO',
    footer_text:             'Ex.: Todos os direitos reservados.',
    meta_title:              'Ex.: Minha Loja — Energia Solar no Brasil',
    meta_description:        'Descrição padrão para motores de busca (até 160 caracteres)',
    google_analytics_id:     'Ex.: G-XXXXXXXXXX',
    free_shipping_min_cents: 'Valor em centavos (Ex.: 20000 = R$ 200,00)',
    max_installments:        'Ex.: 12',
    pix_discount_percent:    'Ex.: 5',
    google_client_id:        'Ex.: 123456789-abc.apps.googleusercontent.com',
    google_client_secret:    'Ex.: GOCSPX-xxxxxxxxxxxxxxxxxxxx',
    google_redirect_url:     'Ex.: https://minhaloja.com.br/auth/google/callback',
};

interface GoogleStep {
    text: React.ReactNode;
    linkLabel?: string;
    href?: string;
}

const GOOGLE_OAUTH_STEPS: GoogleStep[] = [
    {
        text: 'Acesse o Google Cloud Console e crie um projeto (ou selecione um existente).',
        linkLabel: 'Abrir "Criar projeto"',
        href: 'https://console.cloud.google.com/projectcreate',
    },
    {
        text: 'Configure a "Tela de consentimento OAuth": nome do app, e-mail de suporte e domínio autorizado.',
        linkLabel: 'Abrir "Tela de consentimento OAuth"',
        href: 'https://console.cloud.google.com/apis/credentials/consent',
    },
    {
        text: 'Crie uma credencial do tipo "ID do cliente OAuth" com o tipo de aplicativo "Aplicativo da Web".',
        linkLabel: 'Abrir "Credenciais"',
        href: 'https://console.cloud.google.com/apis/credentials',
    },
    {
        text: 'Em "URIs de redirecionamento autorizados", cole exatamente a URL do campo "URL de callback (Redirect URI)" abaixo.',
    },
    {
        text: 'Copie o "Client ID" e o "Client Secret" gerados pelo Google e cole nos campos correspondentes abaixo.',
    },
    {
        text: 'Ative a opção "Login com Google habilitado" e clique em "Salvar configurações".',
    },
];

function GoogleOAuthGuide() {
    return (
        <Alert severity="info" icon={false} sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                Como integrar o login com Google — passo a passo
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {GOOGLE_OAUTH_STEPS.map((step, index) => (
                    <Box component="li" key={index}>
                        <Typography variant="body2" component="span">{step.text}</Typography>
                        {step.href && (
                            <Box sx={{ mt: 0.25 }}>
                                <MuiLink
                                    href={step.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13, fontWeight: 600 }}
                                >
                                    {step.linkLabel}
                                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                                </MuiLink>
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        </Alert>
    );
}

interface GoogleOAuthCheck {
    label: string;
    ok: boolean;
    detail: string | null;
}

interface GoogleOAuthTestResult {
    success: boolean;
    message: string;
    checks: GoogleOAuthCheck[];
}

function GoogleOAuthTestPanel() {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<GoogleOAuthTestResult | null>(null);

    const runTest = async () => {
        setTesting(true);
        setResult(null);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/admin/settings/google-oauth/test', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({ success: false, message: 'Erro de comunicação com o servidor.', checks: [] });
        } finally {
            setTesting(false);
        }
    };

    return (
        <Box sx={{ mb: 2.5 }}>
            <Button
                variant="outlined"
                startIcon={testing ? <CircularProgress size={14} /> : <FactCheckIcon />}
                onClick={runTest}
                disabled={testing}
                size="small"
            >
                {testing ? 'Testando...' : 'Testar configuração do login com Google'}
            </Button>

            {result && (
                <Alert severity={result.success ? 'success' : 'warning'} sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{result.message}</Typography>
                    <Stack spacing={0.75}>
                        {result.checks.map((check, index) => (
                            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                                {check.ok
                                    ? <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
                                    : <CancelIcon sx={{ fontSize: 18, color: 'error.main', mt: '2px' }} />}
                                <Box>
                                    <Typography variant="body2">{check.label}</Typography>
                                    {check.detail && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                            {check.detail}
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>
                        ))}
                    </Stack>
                </Alert>
            )}
        </Box>
    );
}

export default function SettingsIndex({ groups }: Props) {
    // Filtra os grupos gerenciados pela página de Identidade Visual
    const visibleGroups = Object.fromEntries(
        Object.entries(groups).filter(([group]) => !BRANDING_GROUPS.includes(group))
    );

    const allSettings = Object.values(visibleGroups).flat();

    // Estado local com todos os valores dos campos visíveis
    const [values, setValues] = useState<Record<string, string>>(
        Object.fromEntries(allSettings.map((s) => [s.key, s.value ?? '']))
    );
    const [processing, setProcessing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

    const toggleSecretVisibility = (key: string) => {
        setVisibleSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const copyToClipboard = (value: string) => {
        navigator.clipboard.writeText(value);
    };

    // Campos com máscara automática
    const MASKED_FIELDS: Record<string, (v: string) => string> = {
        store_phone: maskPhone,
        store_cnpj:  maskCnpj,
    };

    // Atualiza apenas o campo alterado sem afetar os outros
    const handleChange = (key: string, value: string) => {
        const masked = MASKED_FIELDS[key] ? MASKED_FIELDS[key](value) : value;
        setValues((prev) => ({ ...prev, [key]: masked }));
        setSaved(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const settings = Object.entries(values).map(([key, value]) => ({ key, value }));

        setProcessing(true);
        router.put('/admin/settings', { settings }, {
            onSuccess: () => setSaved(true),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout title="Configurações" breadcrumbs={[{ label: 'Sistema' }, { label: 'Configurações' }]}>
            <Head title="Configurações — Admin" />

            {saved && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Configurações salvas com sucesso!
                </Alert>
            )}

            {/* Link para identidade visual */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'primary.200', borderRadius: 2, p: 2, mb: 3, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Logo, cores e redes sociais
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Configurações de identidade visual estão em uma página separada.
                    </Typography>
                </Box>
                <Button
                    component={Link}
                    href="/admin/branding"
                    variant="outlined"
                    size="small"
                    startIcon={<PaletteIcon />}
                >
                    Identidade Visual
                </Button>
            </Paper>

            <Box component="form" onSubmit={handleSubmit}>
                <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={processing}
                        size="large"
                    >
                        {processing ? 'Salvando...' : 'Salvar configurações'}
                    </Button>
                </Stack>

                <Stack spacing={3}>
                    {Object.entries(visibleGroups).map(([group, settings]) => (
                        <Paper
                            key={group}
                            elevation={0}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
                        >
                            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {GROUP_LABELS[group] ?? group}
                                </Typography>
                                <Chip
                                    label={`${settings.length} configuração${settings.length !== 1 ? 'ões' : ''}`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>

                            <Box sx={{ p: 3 }}>
                                {group === 'social_login' && (
                                    <>
                                        <GoogleOAuthGuide />
                                        <GoogleOAuthTestPanel />
                                    </>
                                )}
                                <Grid container spacing={2.5}>
                                    {settings.map((setting) => (
                                        <Grid
                                            key={setting.key}
                                            size={{ xs: 12, md: setting.type === 'boolean' ? 6 : 12 }}
                                        >
                                            {setting.type === 'boolean' ? (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={
                                                                values[setting.key] === 'true' ||
                                                                values[setting.key] === '1'
                                                            }
                                                            onChange={(e) =>
                                                                handleChange(setting.key, e.target.checked ? 'true' : 'false')
                                                            }
                                                            color="primary"
                                                        />
                                                    }
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {setting.label}
                                                            </Typography>
                                                            {setting.description && (
                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                    {setting.description}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            ) : setting.type === 'password' ? (
                                                <TextField
                                                    label={setting.label}
                                                    value={values[setting.key] ?? ''}
                                                    onChange={(e) => handleChange(setting.key, e.target.value)}
                                                    fullWidth
                                                    size="small"
                                                    type={visibleSecrets[setting.key] ? 'text' : 'password'}
                                                    placeholder={PLACEHOLDERS[setting.key] ?? ''}
                                                    helperText={setting.description ?? undefined}
                                                    autoComplete="new-password"
                                                    slotProps={{
                                                        input: {
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => toggleSecretVisibility(setting.key)}
                                                                        edge="end"
                                                                    >
                                                                        {visibleSecrets[setting.key] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                />
                                            ) : (
                                                <TextField
                                                    label={setting.label}
                                                    value={values[setting.key] ?? ''}
                                                    onChange={(e) => handleChange(setting.key, e.target.value)}
                                                    fullWidth
                                                    size="small"
                                                    type={setting.type === 'integer' ? 'number' : 'text'}
                                                    placeholder={PLACEHOLDERS[setting.key] ?? ''}
                                                    helperText={setting.description ?? undefined}
                                                    multiline={['store_description', 'footer_text', 'meta_description'].includes(setting.key)}
                                                    rows={['store_description', 'footer_text', 'meta_description'].includes(setting.key) ? 3 : 1}
                                                    slotProps={
                                                        setting.key === 'google_redirect_url'
                                                            ? {
                                                                  input: {
                                                                      endAdornment: (
                                                                          <InputAdornment position="end">
                                                                              <IconButton
                                                                                  size="small"
                                                                                  onClick={() => copyToClipboard(values[setting.key] ?? '')}
                                                                                  edge="end"
                                                                              >
                                                                                  <ContentCopyIcon fontSize="small" />
                                                                              </IconButton>
                                                                          </InputAdornment>
                                                                      ),
                                                                  },
                                                              }
                                                            : undefined
                                                    }
                                                />
                                            )}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            </Box>
        </AdminLayout>
    );
}
