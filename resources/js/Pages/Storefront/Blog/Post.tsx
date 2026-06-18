import { Head, Link } from '@inertiajs/react';
import {
    Box, Card, CardActionArea, CardContent, CardMedia, Chip,
    Container, Divider, Grid, Stack, Typography,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { PageProps } from '@inertiajs/react';

interface PostDetail {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    cover_image: string | null;
    published_at: string;
    meta_title: string | null;
    meta_description: string | null;
    reading_time: number;
    author: { id: number; name: string };
    category: { id: number; name: string; slug: string } | null;
}

interface RelatedPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    published_at: string;
    author: { id: number; name: string };
}

interface Props extends PageProps {
    post: PostDetail;
    related: RelatedPost[];
}

export default function BlogPost({ post, related }: Props) {
    return (
        <StorefrontLayout>
            <Head title={`${post.meta_title || post.title} — Blog`}>
                {post.meta_description && <meta name="description" content={post.meta_description} />}
            </Head>

            {/* Hero com cover */}
            {post.cover_image && (
                <Box
                    sx={{
                        width: '100%',
                        maxHeight: 480,
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <Box
                        component="img"
                        src={`/storage/${post.cover_image}`}
                        alt={post.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', maxHeight: 480 }}
                    />
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
                </Box>
            )}

            <Container maxWidth="md" sx={{ py: 6 }}>
                {/* Breadcrumb */}
                <Stack direction="row" spacing={0.5} sx={{ mb: 3, color: 'text.secondary', fontSize: 14 }}>
                    <Box component={Link} href="/" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}>Início</Box>
                    <Typography variant="body2">/</Typography>
                    <Box component={Link} href="/blog" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}>Blog</Box>
                    {post.category && (
                        <>
                            <Typography variant="body2">/</Typography>
                            <Box component={Link} href={`/blog?category=${post.category.slug}`} sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}>
                                {post.category.name}
                            </Box>
                        </>
                    )}
                </Stack>

                {/* Categoria */}
                {post.category && (
                    <Chip
                        label={post.category.name}
                        component={Link}
                        href={`/blog?category=${post.category.slug}`}
                        clickable
                        sx={{ mb: 2 }}
                    />
                )}

                {/* Título */}
                <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.2, mb: 3 }}>
                    {post.title}
                </Typography>

                {/* Meta info */}
                <Stack direction="row" spacing={3} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <PersonIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">{post.author.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <CalendarTodayIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">
                            {new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <AccessTimeIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">{post.reading_time} min de leitura</Typography>
                    </Box>
                </Stack>

                <Divider sx={{ mb: 4 }} />

                {/* Conteúdo */}
                <Box
                    dangerouslySetInnerHTML={{ __html: post.content }}
                    sx={{
                        '& h2': { fontSize: '1.6rem', fontWeight: 700, mt: 4, mb: 2 },
                        '& h3': { fontSize: '1.3rem', fontWeight: 700, mt: 3, mb: 1.5 },
                        '& p': { lineHeight: 1.8, mb: 2, color: 'text.primary' },
                        '& ul, & ol': { pl: 3, mb: 2 },
                        '& li': { mb: 0.5, lineHeight: 1.7 },
                        '& img': { maxWidth: '100%', borderRadius: 2, my: 2 },
                        '& blockquote': {
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            pl: 2,
                            ml: 0,
                            my: 3,
                            color: 'text.secondary',
                            fontStyle: 'italic',
                        },
                        '& code': { bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5, fontFamily: 'monospace', fontSize: 14 },
                        '& pre': { bgcolor: 'grey.900', color: 'grey.100', p: 2, borderRadius: 2, overflow: 'auto', mb: 2 },
                        '& a': { color: 'primary.main', textDecoration: 'underline' },
                    }}
                />

                {/* Posts relacionados */}
                {related.length > 0 && (
                    <Box sx={{ mt: 8 }}>
                        <Divider sx={{ mb: 4 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Artigos relacionados</Typography>
                        <Grid container spacing={3}>
                            {related.map((r) => (
                                <Grid key={r.id} size={{ xs: 12, sm: 4 }}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                        <CardActionArea component={Link} href={`/blog/${r.slug}`}>
                                            {r.cover_image && (
                                                <CardMedia
                                                    component="img"
                                                    height={120}
                                                    image={`/storage/${r.cover_image}`}
                                                    alt={r.title}
                                                    sx={{ objectFit: 'cover' }}
                                                />
                                            )}
                                            <CardContent>
                                                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                                                    {r.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {new Date(r.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>
        </StorefrontLayout>
    );
}
