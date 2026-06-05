import { useState } from 'react';
import { Box, Typography, Paper, IconButton, Collapse, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/Types/inertia';

export default function WhatsAppButton() {
    const { branding } = usePage<SharedProps>().props;
    const phone = branding?.social_whatsapp?.replace(/\D/g, '') || '5511999999999';
    const [open, setOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Olá! Preciso de ajuda com um produto da SolarHub Commerce.')}`;

    return (
        <Box sx={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5,
        }}>
            {/* Balão de chat */}
            <Collapse in={open} unmountOnExit>
                <Paper elevation={8} sx={{
                    width: 300, borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                    animation: 'fadeSlideUp 0.25s ease',
                    '@keyframes fadeSlideUp': {
                        from: { opacity: 0, transform: 'translateY(12px)' },
                        to:   { opacity: 1, transform: 'translateY(0)' },
                    },
                }}>
                    {/* Header verde */}
                    <Box sx={{
                        bgcolor: '#25D366', p: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '50%',
                                bgcolor: 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <WhatsAppIcon sx={{ color: 'white', fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                                    SolarHub Commerce
                                </Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#A8F0C6' }} />
                                    <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>Online agora</Typography>
                                </Stack>
                            </Box>
                        </Stack>
                        <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Corpo */}
                    <Box sx={{ bgcolor: '#ECE5DD', p: 2 }}>
                        <Box sx={{
                            bgcolor: 'white', borderRadius: '0 12px 12px 12px',
                            p: 1.5, mb: 1.5,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}>
                            <Typography sx={{ fontSize: 13.5, color: '#303030', lineHeight: 1.5 }}>
                                👋 Olá! Posso te ajudar a escolher o sistema solar ideal para sua necessidade.
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#888', mt: 0.5, textAlign: 'right' }}>
                                Seg-Sex 8h–18h
                            </Typography>
                        </Box>

                        <Box
                            component="a"
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                bgcolor: '#25D366', color: 'white',
                                p: 1.3, borderRadius: 2,
                                textDecoration: 'none', fontWeight: 700, fontSize: 14,
                                transition: 'filter 0.15s',
                                '&:hover': { filter: 'brightness(0.92)' },
                            }}
                        >
                            <WhatsAppIcon sx={{ fontSize: 20 }} />
                            Iniciar conversa
                        </Box>
                    </Box>
                </Paper>
            </Collapse>

            {/* Botão flutuante */}
            <Box sx={{ position: 'relative' }}>
                {!open && (
                    <Box sx={{
                        position: 'absolute', top: -4, right: -4,
                        width: 14, height: 14, borderRadius: '50%',
                        bgcolor: '#FF4444', border: '2px solid white',
                        zIndex: 1,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                            '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                            '50%': { transform: 'scale(1.3)', opacity: 0.7 },
                        },
                    }} />
                )}
                <Box
                    onClick={() => setOpen(v => !v)}
                    sx={{
                        width: 56, height: 56, borderRadius: '50%',
                        bgcolor: '#25D366',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            transform: 'scale(1.08)',
                            boxShadow: '0 6px 28px rgba(37,211,102,0.55)',
                        },
                    }}
                >
                    <WhatsAppIcon sx={{ color: 'white', fontSize: 30 }} />
                </Box>
            </Box>
        </Box>
    );
}
