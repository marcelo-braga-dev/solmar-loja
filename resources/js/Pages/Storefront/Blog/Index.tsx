import { Head, Link, router } from '@inertiajs/react';
import {
    Box, Card, CardActionArea, CardContent, CardMedia, Chip, Container,
    Grid, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface PostItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    published_at: string;
    reading_time: number;
    author: { id: number; name: string };
    category: { id: number; name: string; slug: string } | null;
}

interface CategoryItem { id: number; name: string; slug: string; posts_count: number }

interface Props extends PageProps {
    posts: PaginatedData<PostItem>;
    categories: CategoryItem[];
    filters: { category?: string; q?: string };
}

export default function BlogIndex({ posts, categories, filters }: Props) {
    const applyFilter = (updates: Record<string, string>) => {
        router.get('/blog', { ...filters, ...updates }, { preserveState: true, replace: true });
    };

    return (
        <StorefrontLayout>
            <Head title="Blog" />

            {/* Hero */}
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 6, md: 8 } }}>
                <Container maxWidth="lg">
                    <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Blog</Typography>
                        <Typography variant="h6" sx={{ opacity: 0.85, mb: 4, fontWeight: 400 }}>
                            Dicas, tutoriais e novidades sobre energia solar
                        </Typography>
                        <TextField
                            placeholder="Buscar artigos..."
                            defaultValue={filters.q}
                            onKeyDown={(e) => { if (e.key === 'Enter') applyFilter({ q: (e.target as HTMLInputElement).value }); }}
                            slotProps={{
                                input: {
                                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'grey.500' }} /></InputAdornment>,
                                }
                            }}
                            sx={{
                                width: { xs: '100%', sm: 480 },
                                bgcolor: 'white',
                                borderRadius: 2,
                                '& fieldset': { border: 'none' },
                            }}
                        />
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Grid container spacing={4}>
                    {/* Sidebar categorias */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Categorias</Typography>
                        <Stack spacing={1}>
                            <Chip
                                label="Todos os artigos"
                                onClick={() => applyFilter({ category: '' })}
                                color={!filters.category ? 'primary' : 'default'}
                                clickable
                                sx={{ justifyContent: 'flex-start', px: 1 }}
                            />
                            {categories.map((cat) => (
                                <Chip
                                    key={cat.id}
                                    label={`${cat.name} (${cat.posts_count})`}
                                    onClick={() => applyFilter({ category: cat.slug })}
                                    color={filters.category === cat.slug ? 'primary' : 'default'}
                                    clickable
                                    sx={{ justifyContent: 'flex-start', px: 1 }}
                                />
                            ))}
                        </Stack>
                    </Grid>

                    {/* Grid de posts */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        {posts.data.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <ArticleIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                                <Typography variant="h6" sx={{ color: 'text.secondary' }}>Nenhum artigo encontrado.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {posts.data.map((post) => (
                                    <Grid key={post.id} size={{ xs: 12, sm: 6 }}>
                                        <Card
                                            elevation={0}
                                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}
                                        >
                                            <CardActionArea component={Link} href={`/blog/${post.slug}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                                                {post.cover_image && (
                                                    <CardMedia
                                                        component="img"
                                                        height={180}
                                                        image={`/storage/${post.cover_image}`}
                                                        alt={post.title}
                                                        sx={{ objectFit: 'cover' }}
                                                    />
                                                )}
                                                <CardContent sx={{ flexGrow: 1 }}>
                                                    {post.category && (
                                                        <Chip label={post.category.name} size="small" sx={{ mb: 1 }} />
                                                    )}
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.4 }}>
                                                        {post.title}
                                                    </Typography>
                                                    {post.excerpt && (
                                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }} noWrap>
                                                            {post.excerpt}
                                                        </Typography>
                                                    )}
                                                    <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                            <CalendarTodayIcon sx={{ fontSize: 14 }} />
                                                            <Typography variant="caption">
                                                                {new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {post.reading_time} min de leitura
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {posts.last_page > 1 && (
                            <Box sx={{ mt: 4 }}>
                                <Pagination pagination={posts} />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </StorefrontLayout>
    );
}
