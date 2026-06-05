import { Link } from '@inertiajs/react';
import { type ElementType } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useComparison } from '@/Hooks/useComparison';
import { formatBRL } from '@/Lib/formatters';

export default function ComparisonBar() {
    const { items, remove, clear, count } = useComparison();

    if (count === 0) return null;

    return (
        <Box sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
            animation: 'slideUp 0.3s ease',
            '@keyframes slideUp': {
                from: { transform: 'translateY(100%)' },
                to:   { transform: 'translateY(0)' },
            },
        }}>
            <Paper elevation={8} sx={{
                bgcolor: '#0D1B3E',
                borderTop: '3px solid #FFB300',
                px: 3, py: 2,
            }}>
                <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: { md: 'center' }, gap: 2 }}>
                    {/* Label */}
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                        <CompareArrowsIcon sx={{ color: '#FFB300', fontSize: 22 }} />
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                            Comparar ({count}/4)
                        </Typography>
                    </Stack>

                    {/* Produtos */}
                    <Stack direction="row" spacing={1.5} sx={{ flex: 1, overflowX: 'auto', pb: { xs: 0.5, md: 0 } }}>
                        {items.map((p) => (
                            <Box key={p.id} sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                bgcolor: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 2, px: 1.5, py: 0.8,
                                minWidth: 180, flexShrink: 0,
                            }}>
                                <Avatar
                                    src={p.cover_image ?? undefined}
                                    variant="rounded"
                                    sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.1)' }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ color: 'white', fontSize: 12, fontWeight: 600, lineHeight: 1.2 }} noWrap>
                                        {p.name}
                                    </Typography>
                                    <Typography sx={{ color: '#FFB300', fontSize: 11, fontWeight: 700 }}>
                                        {formatBRL(p.price_cents)}
                                    </Typography>
                                </Box>
                                <Tooltip title="Remover da comparação">
                                    <IconButton size="small" onClick={() => remove(p.id)} sx={{ color: 'rgba(255,255,255,0.4)', p: 0.3, '&:hover': { color: 'white' } }}>
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ))}

                        {/* Slots vazios */}
                        {Array.from({ length: 4 - count }).map((_, i) => (
                            <Box key={i} sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 180, flexShrink: 0,
                                border: '1px dashed rgba(255,255,255,0.15)',
                                borderRadius: 2, px: 1.5, py: 0.8, minHeight: 52,
                            }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                                    + Adicionar produto
                                </Typography>
                            </Box>
                        ))}
                    </Stack>

                    {/* Ações */}
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        <Tooltip title="Limpar comparação">
                            <IconButton onClick={clear} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}>
                                <DeleteSweepIcon />
                            </IconButton>
                        </Tooltip>
                        <Button
                            component={Link as ElementType}
                            href={`/comparar?ids=${items.map(p => p.id).join(',')}`}
                            variant="contained"
                            startIcon={<CompareArrowsIcon />}
                            disabled={count < 2}
                            sx={{
                                bgcolor: '#FFB300', color: '#1A1A1A', fontWeight: 700,
                                '&:hover': { bgcolor: '#e6a200' },
                                '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
                            }}
                        >
                            Comparar {count >= 2 ? `(${count})` : ''}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}
