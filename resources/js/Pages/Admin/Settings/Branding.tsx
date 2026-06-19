import { Head, useForm } from '@inertiajs/react';
import {
    Avatar, Box, Button, Card, CardContent,
    Grid, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';

interface BrandingData {
    logo_url: string;
    logo_dark_url: string;
    favicon_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    dark_bg_color: string;
    social_instagram: string;
    social_facebook: string;
    social_youtube: string;
    social_whatsapp: string;
    social_linkedin: string;
    footer_text: string;
}

interface Props extends Omit<PageProps, 'branding'> { branding: BrandingData }

const COLOR_PRESETS = [
    { name: 'Solar Azul (padrão)', primary: '#0B5FFF', secondary: '#FFB300', accent: '#00C853', dark: '#1A1A2E' },
    { name: 'Verde Sustentável', primary: '#2E7D32', secondary: '#FFC107', accent: '#00BCD4', dark: '#1B2A1B' },
    { name: 'Laranja Solar', primary: '#E65100', secondary: '#FDD835', accent: '#42A5F5', dark: '#1A1000' },
    { name: 'Roxo Inovação', primary: '#6A1B9A', secondary: '#FFB300', accent: '#26C6DA', dark: '#1A0A2E' },
    { name: 'Escuro Moderno', primary: '#1565C0', secondary: '#F57F17', accent: '#00BFA5', dark: '#0D1117' },
];

export default function Branding({ branding }: Props) {
    const { data, setData, post, processing } = useForm({
        ...branding,
        logo: null as File | null,
        logo_dark: null as File | null,
        favicon: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/branding', { forceFormData: true });
    };

    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setData(prev => ({
            ...prev,
            primary_color: preset.primary,
            secondary_color: preset.secondary,
            accent_color: preset.accent,
            dark_bg_color: preset.dark,
        }));
    };

    const ColorField = ({ field, label }: { field: keyof typeof data; label: string }) => (
        <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>{label}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box
                    component="input"
                    type="color"
                    value={data[field] as string || '#000000'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData(field, e.target.value)}
                    sx={{
                        width: 48, height: 48, border: '2px solid', borderColor: 'divider',
                        borderRadius: 1, cursor: 'pointer', padding: 0,
                    }}
                />
                <TextField
                    size="small"
                    value={data[field] as string}
                    onChange={(e) => setData(field, e.target.value)}
                    slotProps={{ input: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
                    sx={{ width: 120 }}
                    placeholder="#000000"
                />
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: data[field] as string, border: '1px solid', borderColor: 'divider' }} />
            </Stack>
        </Box>
    );

    return (
        <AdminLayout>
            <Head title="Identidade Visual — Admin" />

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Identidade Visual</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Configure logo, cores e redes sociais da sua loja.
                    </Typography>
                </Box>
            </Stack>

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>

                    {/* Coluna esquerda */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3}>

                            {/* Paleta de cores */}
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Paleta de cores</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                                        Cores principais usadas no tema da loja.
                                    </Typography>

                                    {/* Presets */}
                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Temas prontos
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                        {COLOR_PRESETS.map((preset) => (
                                            <Button
                                                key={preset.name}
                                                size="small"
                                                variant="outlined"
                                                onClick={() => applyPreset(preset)}
                                                sx={{ fontSize: 11 }}
                                                startIcon={
                                                    <Stack direction="row" spacing={0.3}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: preset.primary }} />
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: preset.secondary }} />
                                                    </Stack>
                                                }
                                            >
                                                {preset.name}
                                            </Button>
                                        ))}
                                    </Stack>

                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <ColorField field="primary_color" label="Cor primária (links, botões, header)" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <ColorField field="secondary_color" label="Cor secundária (destaques, badges)" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <ColorField field="accent_color" label="Cor de ação (sucesso, confirmações)" />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <ColorField field="dark_bg_color" label="Fundo escuro (rodapé, menu admin)" />
                                        </Grid>
                                    </Grid>

                                    {/* Preview */}
                                    <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Preview
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                            <Box sx={{ bgcolor: data.primary_color, color: 'white', px: 2, py: 0.8, borderRadius: 1, fontSize: 13, fontWeight: 600 }}>Botão primário</Box>
                                            <Box sx={{ bgcolor: data.secondary_color, px: 2, py: 0.8, borderRadius: 1, fontSize: 13, fontWeight: 600 }}>Badge</Box>
                                            <Box sx={{ bgcolor: data.accent_color, color: 'white', px: 2, py: 0.8, borderRadius: 1, fontSize: 13, fontWeight: 600 }}>Sucesso</Box>
                                            <Box sx={{ bgcolor: data.dark_bg_color, color: 'white', px: 2, py: 0.8, borderRadius: 1, fontSize: 13, fontWeight: 600 }}>Rodapé</Box>
                                            <Box sx={{ borderColor: data.primary_color, color: data.primary_color, border: '2px solid', px: 2, py: 0.8, borderRadius: 1, fontSize: 13, fontWeight: 600 }}>Outlined</Box>
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Redes sociais */}
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Redes sociais</Typography>
                                    <Stack spacing={2}>
                                        {[
                                            { field: 'social_instagram', label: 'Instagram', icon: <InstagramIcon sx={{ color: '#E1306C' }} />, placeholder: 'https://instagram.com/minhaloja' },
                                            { field: 'social_facebook', label: 'Facebook', icon: <FacebookIcon sx={{ color: '#1877F2' }} />, placeholder: 'https://facebook.com/minhaloja' },
                                            { field: 'social_youtube', label: 'YouTube', icon: <YouTubeIcon sx={{ color: '#FF0000' }} />, placeholder: 'https://youtube.com/@minhaloja' },
                                            { field: 'social_whatsapp', label: 'WhatsApp (número)', icon: <WhatsAppIcon sx={{ color: '#25D366' }} />, placeholder: '5511999999999' },
                                            { field: 'social_linkedin', label: 'LinkedIn', icon: <LinkedInIcon sx={{ color: '#0A66C2' }} />, placeholder: 'https://linkedin.com/company/minhaloja' },
                                        ].map(({ field, label, icon, placeholder }) => (
                                            <TextField
                                                key={field}
                                                label={label}
                                                value={data[field as keyof typeof data] as string}
                                                onChange={(e) => setData(field as keyof typeof data, e.target.value)}
                                                fullWidth
                                                size="small"
                                                placeholder={placeholder}
                                                slotProps={{
                                                    input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> }
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Texto do rodapé */}
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Rodapé</Typography>
                                    <TextField
                                        label="Texto do rodapé"
                                        value={data.footer_text}
                                        onChange={(e) => setData('footer_text', e.target.value)}
                                        multiline
                                        rows={2}
                                        fullWidth
                                        placeholder="Ex.: Todos os direitos reservados. CNPJ 00.000.000/0001-00"
                                    />
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>

                    {/* Coluna direita — Logos */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3}>

                            {/* Logo principal */}
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Logo (fundo claro)</Typography>
                                    <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, p: 3, textAlign: 'center', mb: 2, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {data.logo_url ? (
                                            <Box component="img" src={data.logo_url} sx={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <Stack sx={{ alignItems: 'center', opacity: 0.4 }}>
                                                <SolarPowerIcon sx={{ fontSize: 36 }} />
                                                <Typography variant="caption">Sem logo</Typography>
                                            </Stack>
                                        )}
                                    </Box>
                                    <Button variant="outlined" component="label" fullWidth size="small">
                                        {data.logo_url ? 'Trocar logo' : 'Upload logo'}
                                        <input type="file" hidden accept="image/png,image/svg+xml,image/webp" onChange={(e) => setData('logo', e.target.files?.[0] ?? null)} />
                                    </Button>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, textAlign: 'center' }}>PNG, SVG ou WebP. Máx. 2MB.</Typography>
                                </CardContent>
                            </Card>

                            {/* Logo escura */}
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Logo (fundo escuro)</Typography>
                                    <Box sx={{ bgcolor: data.dark_bg_color || '#1A1A2E', borderRadius: 2, p: 3, textAlign: 'center', mb: 2, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {data.logo_dark_url ? (
                                            <Box component="img" src={data.logo_dark_url} sx={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <Stack sx={{ alignItems: 'center', opacity: 0.4, color: 'white' }}>
                                                <SolarPowerIcon sx={{ fontSize: 36 }} />
                                                <Typography variant="caption">Sem logo</Typography>
                                            </Stack>
                                        )}
                                    </Box>
                                    <Button variant="outlined" component="label" fullWidth size="small">
                                        {data.logo_dark_url ? 'Trocar logo escura' : 'Upload logo escura'}
                                        <input type="file" hidden accept="image/png,image/svg+xml,image/webp" onChange={(e) => setData('logo_dark', e.target.files?.[0] ?? null)} />
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Favicon */}
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Favicon</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                        Ícone da aba do navegador. Recomendado: 32×32 ou 64×64 px.
                                    </Typography>
                                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                                        {data.favicon_url ? (
                                            <Box component="img" src={data.favicon_url} sx={{ width: 32, height: 32, objectFit: 'contain', border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }} />
                                        ) : (
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>S</Avatar>
                                        )}
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {data.favicon_url ? 'Favicon atual' : 'Nenhum favicon'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Exibido na aba do browser
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Button variant="outlined" component="label" fullWidth size="small">
                                        Upload favicon
                                        <input type="file" hidden accept="image/png,image/x-icon,image/svg+xml" onChange={(e) => setData('favicon', e.target.files?.[0] ?? null)} />
                                    </Button>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, textAlign: 'center' }}>PNG ou ICO. Máx. 512KB.</Typography>
                                </CardContent>
                            </Card>

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={processing}
                                sx={{ fontWeight: 700, py: 1.5 }}
                            >
                                {processing ? 'Salvando...' : 'Salvar identidade visual'}
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </AdminLayout>
    );
}
