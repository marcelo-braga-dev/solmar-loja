import { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BoltIcon from '@mui/icons-material/Bolt';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import VerifiedIcon from '@mui/icons-material/Verified';

const MESSAGES = [
    { icon: <LocalShippingIcon sx={{ fontSize: 14 }} />, text: 'Frete grátis em todo o Brasil para compras acima do valor mínimo' },
    { icon: <BoltIcon sx={{ fontSize: 14 }} />, text: '⚡ Parcelamos em até 12x sem juros no cartão de crédito' },
    { icon: <VerifiedIcon sx={{ fontSize: 14 }} />, text: 'Todos os produtos com garantia do fabricante e nota fiscal' },
    { icon: <HeadsetMicIcon sx={{ fontSize: 14 }} />, text: '📞 Suporte técnico especializado em energia solar — seg a sex 8h–18h' },
];

export default function AnnouncementBar() {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(true);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimating(true);
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % MESSAGES.length);
                setAnimating(false);
            }, 300);
        }, 4500);
        return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    const msg = MESSAGES[current];

    return (
        <Box sx={{
            bgcolor: '#0D1B3E',
            color: 'white',
            py: 0.7,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: 36,
        }}>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                opacity: animating ? 0 : 1,
                transform: animating ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'opacity 0.3s, transform 0.3s',
            }}>
                <Box sx={{ color: '#FFB300', display: 'flex', alignItems: 'center' }}>
                    {msg.icon}
                </Box>
                <Typography variant="caption" sx={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.2, color: 'rgba(255,255,255,0.9)' }}>
                    {msg.text}
                </Typography>
            </Box>

            {/* Dots */}
            <Box sx={{ display: 'flex', gap: 0.5, position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }}>
                {MESSAGES.map((_, i) => (
                    <Box
                        key={i}
                        onClick={() => setCurrent(i)}
                        sx={{
                            width: i === current ? 16 : 5, height: 5,
                            borderRadius: 3,
                            bgcolor: i === current ? '#FFB300' : 'rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                        }}
                    />
                ))}
            </Box>

            <IconButton
                size="small"
                onClick={() => setVisible(false)}
                sx={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)',
                    p: 0.3,
                    '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                }}
            >
                <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
        </Box>
    );
}
