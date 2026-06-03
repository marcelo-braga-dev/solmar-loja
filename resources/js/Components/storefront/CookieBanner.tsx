import { Box, Button, Link, Slide, Stack, Typography } from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'solarhub_cookie_consent';

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem(STORAGE_KEY);
        if (!consent) {
            setTimeout(() => setVisible(true), 800);
        }
    }, []);

    const accept = (all: boolean) => {
        localStorage.setItem(STORAGE_KEY, all ? 'all' : 'essential');
        setVisible(false);
    };

    return (
        <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    bgcolor: '#1A1A2E',
                    color: 'white',
                    p: { xs: 2, md: 3 },
                    borderTop: '3px solid',
                    borderColor: 'secondary.main',
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
                }}
            >
                <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        sx={{ alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}
                    >
                        <CookieIcon sx={{ color: 'secondary.main', flexShrink: 0 }} />

                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar
                                o tráfego do site. Ao continuar, você concorda com nossa{' '}
                                <Link
                                    href="/privacidade"
                                    sx={{ color: 'secondary.main', textDecoration: 'underline' }}
                                >
                                    Política de Privacidade
                                </Link>
                                {' '}e o uso de cookies conforme a LGPD.
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1} sx={{ flexShrink: 0 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => accept(false)}
                                sx={{
                                    color: 'grey.400',
                                    borderColor: 'grey.600',
                                    '&:hover': { borderColor: 'grey.400', bgcolor: 'transparent' },
                                    fontSize: 12,
                                }}
                            >
                                Apenas essenciais
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => accept(true)}
                                sx={{
                                    bgcolor: 'secondary.main',
                                    color: '#1a1a1a',
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: 'secondary.dark' },
                                    fontSize: 12,
                                }}
                            >
                                Aceitar todos
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        </Slide>
    );
}
