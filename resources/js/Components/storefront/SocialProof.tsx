import { useEffect, useState } from 'react';
import { Box, Stack, Typography, alpha } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatshotIcon from '@mui/icons-material/Whatshot';

interface Props {
    productId: number;
    stockQuantity?: number;
    soldThisMonth?: number;
}

// Simula "pessoas vendo agora" com um número realista baseado no ID
function peopleSeed(id: number): number {
    return 3 + ((id * 7 + 13) % 21); // 3 a 23
}

function soldSeed(id: number, sold?: number): number {
    return sold ?? (15 + ((id * 3 + 17) % 85)); // 15 a 99
}

export default function SocialProof({ productId, stockQuantity, soldThisMonth }: Props) {
    const [viewing, setViewing] = useState(peopleSeed(productId));
    const sold = soldSeed(productId, soldThisMonth);

    // Flutua o número de pessoas vendo (± 1 a cada 15s)
    useEffect(() => {
        const t = setInterval(() => {
            setViewing(v => {
                const delta = Math.random() > 0.5 ? 1 : -1;
                return Math.max(2, Math.min(30, v + delta));
            });
        }, 15000);
        return () => clearInterval(t);
    }, []);

    const lowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 8;

    return (
        <Stack spacing={1}>
            {/* Pessoas vendo agora */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', bgcolor: '#16A34A',
                    animation: 'pulse-green 1.5s infinite',
                    '@keyframes pulse-green': { '0%,100%': { boxShadow: '0 0 0 0 rgba(22,163,74,0.4)' }, '50%': { boxShadow: '0 0 0 6px rgba(22,163,74,0)' } },
                }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{viewing} pessoas</Box>{' '}
                    estão vendo este produto agora
                </Typography>
            </Stack>

            {/* Vendidos no mês */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ShoppingCartIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: '#7C3AED' }}>{sold} vendidos</Box>{' '}
                    nos últimos 30 dias
                </Typography>
            </Stack>

            {/* Alerta de estoque baixo */}
            {lowStock && (
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.8,
                    bgcolor: alpha('#DC2626', 0.08),
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: 1.5, px: 1.5, py: 0.6,
                }}>
                    <WhatshotIcon sx={{ fontSize: 16, color: '#DC2626' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                        Restam apenas {stockQuantity} unidade{stockQuantity !== 1 ? 's' : ''} em estoque!
                    </Typography>
                </Box>
            )}
        </Stack>
    );
}
