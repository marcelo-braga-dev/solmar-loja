import { useEffect, useState } from 'react';
import { Box, LinearProgress, Stack, Typography, alpha } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import TimerIcon from '@mui/icons-material/Timer';

interface FlashSaleData {
    active: boolean;
    title?: string;
    discount_percent?: number;
    remaining_s?: number;
    max_quantity?: number | null;
    sold_count?: number;
    progress_percent?: number;
}

interface Props { productId: number }

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

export default function FlashSaleBanner({ productId }: Props) {
    const [data, setData]           = useState<FlashSaleData | null>(null);
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        fetch(`/api/flash-sale/${productId}`, { headers: { Accept: 'application/json' } })
            .then(r => r.json())
            .then((d: FlashSaleData) => {
                setData(d);
                if (d.active && d.remaining_s) setRemaining(d.remaining_s);
            })
            .catch(() => {});
    }, [productId]);

    useEffect(() => {
        if (remaining <= 0) return;
        const t = setInterval(() => setRemaining(v => Math.max(0, v - 1)), 1000);
        return () => clearInterval(t);
    }, [remaining]);

    if (!data?.active || remaining <= 0) return null;

    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    const pct = data.progress_percent ?? 0;

    return (
        <Box sx={{
            background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #B91C1C 100%)',
            borderRadius: 2.5,
            p: 2,
            mb: 2,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Brilho decorativo */}
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1.5 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BoltIcon sx={{ color: '#FFD54F', fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {data.title ?? 'Promoção Relâmpago'}
                        </Typography>
                        <Typography sx={{ color: 'white', fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>
                            {data.discount_percent}% OFF agora!
                        </Typography>
                    </Box>
                </Stack>

                {/* Countdown */}
                <Box sx={{
                    bgcolor: 'rgba(0,0,0,0.25)',
                    borderRadius: 2, px: 2, py: 1,
                    display: 'flex', alignItems: 'center', gap: 1,
                    border: '1px solid rgba(255,255,255,0.15)',
                }}>
                    <TimerIcon sx={{ color: '#FFD54F', fontSize: 18 }} />
                    <Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 1 }}>Termina em</Typography>
                        <Typography sx={{
                            color: 'white', fontWeight: 900, fontSize: 22,
                            fontFamily: 'monospace', lineHeight: 1.1,
                            animation: remaining < 300 ? 'blink 0.8s infinite' : 'none',
                            '@keyframes blink': { '50%': { opacity: 0.5 } },
                        }}>
                            {pad(h)}:{pad(m)}:{pad(s)}
                        </Typography>
                    </Box>
                </Box>
            </Stack>

            {/* Barra de progresso de unidades */}
            {data.max_quantity && (
                <Box sx={{ mt: 1.5 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                            🔥 {data.sold_count} unidades vendidas
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                            Restam apenas {(data.max_quantity ?? 0) - (data.sold_count ?? 0)}!
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '& .MuiLinearProgress-bar': { bgcolor: '#FFD54F', borderRadius: 3 },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}
