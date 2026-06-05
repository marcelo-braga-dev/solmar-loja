import { type ReactNode, useState, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    AppBar, Toolbar, Typography, Box, Container, IconButton,
    Badge, Button, Drawer, List, ListItem, TextField, InputAdornment,
    ListItemButton, ListItemText, Divider, useScrollTrigger,
    Slide, useTheme, useMediaQuery, Stack,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SmartSearch from '@/Components/storefront/SmartSearch';
import CookieBanner from '@/Components/storefront/CookieBanner';
import AnnouncementBar from '@/Components/storefront/AnnouncementBar';
import WhatsAppButton from '@/Components/storefront/WhatsAppButton';
import ComparisonBar from '@/Components/storefront/ComparisonBar';
import type { SharedProps } from '@/Types/inertia';

interface Props {
    children: ReactNode;
}

function HideOnScroll({ children }: { children: ReactNode }) {
    const trigger = useScrollTrigger();
    return <Slide appear={false} direction="down" in={!trigger}>{children as React.ReactElement}</Slide>;
}

export default function StorefrontLayout({ children }: Props) {
    const { flash, cartCount, auth, branding, priceList } = usePage<SharedProps>().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Announcement bar */}
            <AnnouncementBar />

            {/* Top bar */}
            <Box sx={{ bgcolor: 'primary.dark', color: 'white', py: 0.5, display: { xs: 'none', md: 'block' } }}>
                <Container maxWidth="lg">
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                            {branding?.store_phone && (
                                <Box
                                    component="a"
                                    href={`tel:${branding.store_phone.replace(/\D/g, '')}`}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: 'inherit', textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
                                >
                                    <PhoneIcon sx={{ fontSize: 14 }} />
                                    {branding.store_phone}
                                </Box>
                            )}
                            {branding?.store_email && (
                                <Box
                                    component="a"
                                    href={`mailto:${branding.store_email}`}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: 'inherit', textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
                                >
                                    <EmailIcon sx={{ fontSize: 14 }} />
                                    {branding.store_email}
                                </Box>
                            )}
                            {branding?.social_whatsapp && (
                                <Box
                                    component="a"
                                    href={`https://wa.me/${branding.social_whatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: 'inherit', textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
                                >
                                    WhatsApp
                                </Box>
                            )}
                        </Stack>
                        {branding?.free_shipping_enabled && (
                            <Typography variant="caption">
                                Frete grátis para compras acima de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((branding.free_shipping_min_cents ?? 200000) / 100)}
                            </Typography>
                        )}
                    </Stack>
                </Container>
            </Box>

            {/* Main AppBar */}
            <HideOnScroll>
                <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ gap: 2, py: 1 }}>
                            {/* Logo */}
                            <Box
                                component={Link}
                                href="/"
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
                            >
                                {branding?.logo_url ? (
                                    <Box component="img" src={branding.logo_url} sx={{ height: 40, maxWidth: 160, objectFit: 'contain' }} alt={branding.store_name} />
                                ) : (
                                    <>
                                        <SolarPowerIcon sx={{ color: 'secondary.main', fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, color: 'primary.main' }}>
                                                {branding?.store_name || 'SolarHub'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                                                Commerce
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Box>

                            {/* Smart Search com autocomplete */}
                            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                                <SmartSearch />
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                {!isMobile && (
                                    <Button
                                        component={Link}
                                        href={auth.user
                                            ? (auth.user.is_admin ? '/admin' : '/conta')
                                            : '/login'}
                                        startIcon={<PersonIcon />}
                                        variant="text"
                                        sx={{ color: 'text.primary' }}
                                    >
                                        {auth.user
                                            ? (auth.user.is_admin ? 'Admin' : auth.user.name.split(' ')[0])
                                            : 'Entrar'}
                                    </Button>
                                )}
                                <IconButton
                                    component={Link}
                                    href="/carrinho"
                                    size="large"
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Badge badgeContent={cartCount || 0} color="error">
                                        <ShoppingCartIcon />
                                    </Badge>
                                </IconButton>
                                {isMobile && (
                                    <IconButton onClick={() => setMobileOpen(true)}>
                                        <MenuIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </Toolbar>
                    </Container>

                    {/* Nav links */}
                    <Box sx={{ bgcolor: 'primary.main', display: { xs: 'none', md: 'block' } }}>
                        <Container maxWidth="lg">
                            <Stack direction="row" spacing={0}>
                                {[
                                    { label: 'Energia Solar', href: '/categorias/energia-solar' },
                                    { label: 'Kits Fotovoltaicos', href: '/categorias/kits-fotovoltaicos' },
                                    { label: 'Painéis Solares', href: '/categorias/paineis-modulos-solares' },
                                    { label: 'Inversores', href: '/categorias/inversores' },
                                    { label: 'Baterias', href: '/categorias/baterias-e-armazenamento' },
                                    { label: 'Mobilidade Elétrica', href: '/categorias/mobilidade-eletrica' },
                                    { label: '☀ Simulador', href: '/simulador' },
                                    { label: 'Blog', href: '/blog' },
                                ].map((item) => (
                                    <Button
                                        key={item.href}
                                        component={Link}
                                        href={item.href}
                                        sx={{
                                            color: 'white',
                                            borderRadius: 0,
                                            px: 2,
                                            py: 1.2,
                                            fontSize: 13,
                                            fontWeight: 500,
                                            '&:hover': { bgcolor: 'primary.dark' },
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </Stack>
                        </Container>
                    </Box>
                </AppBar>
            </HideOnScroll>

            {/* Mobile drawer */}
            <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
                <Box sx={{ width: 280 }}>
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SolarPowerIcon sx={{ color: 'secondary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>SolarHub</Typography>
                    </Box>
                    <List>
                        {[
                            { label: 'Início', href: '/' },
                            { label: 'Energia Solar', href: '/categorias/energia-solar' },
                            { label: 'Kits Fotovoltaicos', href: '/categorias/kits-fotovoltaicos' },
                            { label: 'Painéis Solares', href: '/categorias/paineis-modulos-solares' },
                            { label: 'Inversores', href: '/categorias/inversores' },
                            { label: 'Baterias', href: '/categorias/baterias-e-armazenamento' },
                            { label: 'Mobilidade Elétrica', href: '/categorias/mobilidade-eletrica' },
                            { label: 'Simulador Solar', href: '/simulador' },
                            { label: 'Blog', href: '/blog' },
                        ].map((item) => (
                            <ListItem key={item.href} disablePadding>
                                <ListItemButton component={Link} href={item.href} onClick={() => setMobileOpen(false)}>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        <Divider />
                        <ListItem disablePadding>
                            <ListItemButton
                                component={Link}
                                href={auth.user
                                    ? (auth.user.is_admin ? '/admin' : '/conta')
                                    : '/login'}
                                onClick={() => setMobileOpen(false)}
                            >
                                <ListItemText
                                    primary={auth.user
                                        ? (auth.user.is_admin ? 'Painel Admin' : 'Minha Conta')
                                        : 'Entrar'}
                                />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* Flash messages */}
            {(flash?.success || flash?.error || flash?.info || flash?.warning) && (
                <Box sx={{
                    bgcolor: flash.success ? 'success.light'
                        : flash.error ? 'error.light'
                        : flash.warning ? 'warning.light'
                        : 'info.light',
                    py: 1.5, textAlign: 'center', px: 2,
                }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>
                        {flash.success ?? flash.error ?? flash.warning ?? flash.info}
                    </Typography>
                </Box>
            )}

            {/* Page content */}
            <Box component="main" sx={{ flexGrow: 1, pb: 8 }}>
                {children}
            </Box>

            {/* Newsletter strip */}
            <Box sx={{ bgcolor: 'primary.main', py: 6 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: 'center', gap: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>
                                Fique por dentro das novidades
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                Receba promoções exclusivas, dicas de energia solar e lançamentos em primeira mão.
                            </Typography>
                        </Box>
                        <Box
                            component="form"
                            method="POST"
                            action="/newsletter/subscribe"
                            sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 420 } }}
                        >
                            <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''} />
                            <TextField
                                name="email"
                                type="email"
                                placeholder="Seu melhor e-mail"
                                required
                                size="small"
                                sx={{
                                    flex: 1,
                                    bgcolor: 'white',
                                    borderRadius: 1,
                                    '& fieldset': { border: 'none' },
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ bgcolor: 'secondary.main', color: '#1a1a1a', fontWeight: 700, whiteSpace: 'nowrap', '&:hover': { bgcolor: 'secondary.dark' } }}
                            >
                                Quero receber
                            </Button>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            {/* Footer */}
            <Box component="footer" sx={{ bgcolor: branding?.dark_bg_color || '#1A1A2E', color: 'white', pt: 6, pb: 3, mt: 'auto' }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ mb: 4 }}>
                        <Box sx={{ flex: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                {branding?.logo_dark_url ? (
                                    <Box component="img" src={branding.logo_dark_url} sx={{ height: 36, maxWidth: 160, objectFit: 'contain' }} alt={branding.store_name} />
                                ) : branding?.logo_url ? (
                                    <Box component="img" src={branding.logo_url} sx={{ height: 36, maxWidth: 160, objectFit: 'contain' }} alt={branding.store_name} />
                                ) : (
                                    <>
                                        <SolarPowerIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{branding?.store_name || 'SolarHub Commerce'}</Typography>
                                    </>
                                )}
                            </Box>
                            <Typography variant="body2" sx={{ color: 'grey.400', maxWidth: 320 }}>
                                {branding?.store_description || 'A maior plataforma de e-commerce do segmento fotovoltaico no Brasil.'}
                            </Typography>
                            {(branding?.store_phone || branding?.store_email) && (
                                <Box sx={{ mt: 2 }}>
                                    {branding.store_phone && (
                                        <Typography variant="caption" sx={{ color: 'grey.500', display: 'block' }}>
                                            📞 {branding.store_phone}
                                        </Typography>
                                    )}
                                    {branding.store_email && (
                                        <Typography variant="caption" sx={{ color: 'grey.500', display: 'block' }}>
                                            ✉ {branding.store_email}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>

                        {[
                            {
                                title: 'Produtos',
                                links: [
                                    { label: 'Painéis Solares', href: '/categorias/paineis-modulos-solares' },
                                    { label: 'Inversores', href: '/categorias/inversores' },
                                    { label: 'Kits Fotovoltaicos', href: '/categorias/kits-fotovoltaicos' },
                                    { label: 'Baterias', href: '/categorias/baterias-e-armazenamento' },
                                ],
                            },
                            {
                                title: 'Empresa',
                                links: [
                                    { label: 'Sobre nós', href: '/sobre' },
                                    { label: 'Blog', href: '/blog' },
                                    { label: 'Contato', href: '/contato' },
                                    { label: 'Trabalhe conosco', href: '/vagas' },
                                ],
                            },
                            {
                                title: 'Suporte',
                                links: [
                                    { label: 'Central de Ajuda', href: '/ajuda' },
                                    { label: 'Minha Conta', href: '/conta' },
                                    { label: 'Meus Pedidos', href: '/conta/pedidos' },
                                    { label: 'Política de Privacidade', href: '/privacidade' },
                                ],
                            },
                        ].map((section) => (
                            <Box key={section.title} sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                                    {section.title}
                                </Typography>
                                <Stack spacing={1}>
                                    {section.links.map((link) => (
                                        <Box
                                            key={link.href}
                                            component={Link}
                                            href={link.href}
                                            sx={{ color: 'grey.400', textDecoration: 'none', fontSize: 14, '&:hover': { color: 'white' } }}
                                        >
                                            {link.label}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Stack>

                    <Divider sx={{ borderColor: 'grey.800', my: 3 }} />

                    {/* Redes sociais */}
                    {(branding?.social_instagram || branding?.social_facebook || branding?.social_youtube || branding?.social_whatsapp || branding?.social_linkedin) && (
                        <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                            {[
                                { key: 'social_instagram', label: 'Instagram' },
                                { key: 'social_facebook', label: 'Facebook' },
                                { key: 'social_youtube', label: 'YouTube' },
                                { key: 'social_linkedin', label: 'LinkedIn' },
                                { key: 'social_whatsapp', label: 'WhatsApp', href: (v: string) => `https://wa.me/${v.replace(/\D/g, '')}` },
                            ].filter((s) => branding?.[s.key as keyof typeof branding]).map((s) => {
                                const url = branding![s.key as keyof typeof branding] as string;
                                const href = s.href ? s.href(url) : url;
                                return (
                                    <Box
                                        key={s.key}
                                        component="a"
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            color: 'grey.400', textDecoration: 'none', fontSize: 13,
                                            border: '1px solid', borderColor: 'grey.700',
                                            px: 1.5, py: 0.5, borderRadius: 1,
                                            '&:hover': { color: 'white', borderColor: 'grey.400' },
                                        }}
                                    >
                                        {s.label}
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}

                    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'grey.500' }}>
                            {branding?.footer_text
                                ? branding.footer_text
                                : `© ${new Date().getFullYear()} ${branding?.store_name || 'SolarHub Commerce'}. Todos os direitos reservados.`}
                        </Typography>
                        {branding?.store_cnpj && (
                            <Typography variant="caption" sx={{ color: 'grey.500' }}>
                                CNPJ: {branding.store_cnpj} — Brasil
                            </Typography>
                        )}
                    </Stack>
                </Container>
            </Box>

            <WhatsAppButton />
            <ComparisonBar />
            <CookieBanner />
        </Box>
    );
}
