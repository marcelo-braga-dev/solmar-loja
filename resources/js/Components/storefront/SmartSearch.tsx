import { router } from '@inertiajs/react';
import {
    Box, ClickAwayListener, InputBase, Paper, List, ListItem,
    ListItemButton, ListItemAvatar, Avatar, ListItemText,
    Typography, Divider, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSearch } from '@/Hooks/useSearch';
import { formatBRL } from '@/Lib/formatters';

export default function SmartSearch() {
    const { query, results, loading, open, search, close } = useSearch();

    const hasResults = results.products.length > 0 || results.categories.length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            close();
            router.get('/busca', { q: query });
        }
    };

    return (
        <ClickAwayListener onClickAway={close}>
            <Box sx={{ position: 'relative', flexGrow: 1 }}>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        bgcolor: 'grey.100',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 0.5,
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
                        '&:focus-within': { border: '1px solid', borderColor: 'primary.main', bgcolor: 'white' },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={18} sx={{ mr: 1, color: 'text.secondary' }} />
                    ) : (
                        <SearchIcon sx={{ color: 'text.secondary', mr: 1, flexShrink: 0 }} />
                    )}
                    <InputBase
                        placeholder="Buscar painéis solares, inversores, kits..."
                        value={query}
                        onChange={(e) => search(e.target.value)}
                        fullWidth
                        sx={{ fontSize: 15 }}
                        onFocus={() => query.length >= 2 && hasResults && close === undefined}
                    />
                </Box>

                {open && hasResults && (
                    <Paper
                        elevation={8}
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 0.5,
                            zIndex: 1300,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        {results.categories.length > 0 && (
                            <Box>
                                <Typography variant="caption" sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Categorias
                                </Typography>
                                <List dense disablePadding>
                                    {results.categories.map((cat) => (
                                        <ListItem key={cat.slug} disablePadding>
                                            <ListItemButton onClick={() => { close(); router.get(`/categorias/${cat.slug}`); }}>
                                                <ListItemText primary={cat.name} slotProps={{ primary: { style: { fontSize: 14 } } }} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                                {results.products.length > 0 && <Divider />}
                            </Box>
                        )}

                        {results.products.length > 0 && (
                            <Box>
                                <Typography variant="caption" sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Produtos
                                </Typography>
                                <List dense disablePadding>
                                    {results.products.map((product) => (
                                        <ListItem key={product.slug} disablePadding>
                                            <ListItemButton onClick={() => { close(); router.get(`/produtos/${product.slug}`); }}>
                                                <ListItemAvatar>
                                                    <Avatar src={product.cover_image} variant="rounded" sx={{ width: 36, height: 36, bgcolor: 'grey.100' }} />
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={product.name}
                                                    secondary={product.price_cents ? formatBRL(product.price_cents) : undefined}
                                                    slotProps={{
                                                        primary: { style: { fontSize: 14, fontWeight: 500 } },
                                                        secondary: { style: { fontSize: 12, color: '#0B5FFF' } },
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                            <Typography
                                variant="body2"
                                sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                                onClick={handleSubmit as unknown as React.MouseEventHandler}
                            >
                                Ver todos os resultados para "{query}" →
                            </Typography>
                        </Box>
                    </Paper>
                )}
            </Box>
        </ClickAwayListener>
    );
}
