import { Link } from '@inertiajs/react';
import { Box, Button, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { PaginatedData } from '@/Types/catalog';

interface Props {
    pagination?: Pick<PaginatedData<unknown>, 'current_page' | 'last_page' | 'total' | 'from' | 'to' | 'links'>;
}

export default function Pagination({ pagination }: Props) {
    if (!pagination || pagination.last_page <= 1) return null;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Mostrando {pagination.from}–{pagination.to} de {pagination.total} produtos
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
                {pagination.links.map((link, i) => {
                    if (link.label === '&laquo; Previous') {
                        return (
                            <Button
                                key={i}
                                component={link.url ? Link : 'button'}
                                href={link.url ?? '#'}
                                disabled={!link.url}
                                variant="outlined"
                                size="small"
                                startIcon={<ChevronLeftIcon />}
                            >
                                Anterior
                            </Button>
                        );
                    }
                    if (link.label === 'Next &raquo;') {
                        return (
                            <Button
                                key={i}
                                component={link.url ? Link : 'button'}
                                href={link.url ?? '#'}
                                disabled={!link.url}
                                variant="outlined"
                                size="small"
                                endIcon={<ChevronRightIcon />}
                            >
                                Próxima
                            </Button>
                        );
                    }
                    return (
                        <Button
                            key={i}
                            component={link.url ? Link : 'button'}
                            href={link.url ?? '#'}
                            variant={link.active ? 'contained' : 'outlined'}
                            size="small"
                            disabled={!link.url}
                            sx={{ minWidth: 36 }}
                        >
                            {link.label}
                        </Button>
                    );
                })}
            </Box>
        </Box>
    );
}
