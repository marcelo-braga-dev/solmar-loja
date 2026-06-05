import { Head, router, Link } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, Grid, Paper, Stack,
    Switch, FormControlLabel, TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PaletteIcon from '@mui/icons-material/Palette';
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
    general:  'Dados da Empresa',
    payment:  'Pagamentos',
    shipping: 'Frete',
    seo:      'SEO e Analytics',
};

const PLACEHOLDERS: Record<string, string> = {
    store_name:              'Ex.: SolarHub Commerce',
    store_email:             'Ex.: contato@solarhub.com.br',
    store_phone:             'Ex.: (11) 3000-0000',
    store_cnpj:              'Ex.: 00.000.000/0001-00',
    store_address:           'Ex.: Rua das Flores, 123 — São Paulo, SP',
    store_tagline:           'Ex.: Energia solar para todos',
    store_description:       'Breve descrição que aparece no rodapé e SEO',
    footer_text:             'Ex.: Todos os direitos reservados.',
    meta_title:              'Ex.: SolarHub — Energia Solar no Brasil',
    meta_description:        'Descrição padrão para motores de busca (até 160 caracteres)',
    google_analytics_id:     'Ex.: G-XXXXXXXXXX',
    free_shipping_min_cents: 'Valor em centavos (Ex.: 20000 = R$ 200,00)',
    max_installments:        'Ex.: 12',
    pix_discount_percent:    'Ex.: 5',
};

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
