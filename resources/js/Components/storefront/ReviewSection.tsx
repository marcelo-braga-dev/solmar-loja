import { useForm, usePage } from '@inertiajs/react';
import {
    Box, Button, Divider, Paper, Rating, Stack, TextField,
    Typography, Avatar, Chip, Alert, ImageList, ImageListItem,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useEffect, useRef, useState } from 'react';
import axios from '@/Lib/axios';
import type { SharedProps } from '@/Types/inertia';

interface ReviewData {
    id: number;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
    author: string;
    verified_purchase: boolean;
    created_at: string;
}

interface Props {
    productSlug: string;
    productId: number;
    avgRating?: number;
    totalReviews?: number;
}

export default function ReviewSection({ productSlug, productId, avgRating = 0, totalReviews = 0 }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [avg, setAvg] = useState(avgRating);
    const [total, setTotal] = useState(totalReviews);
    const [showForm, setShowForm] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const { data, setData, post, processing, reset, errors, wasSuccessful } = useForm({
        rating: 5,
        title: '',
        comment: '',
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).slice(0, 4);
        setPhotoFiles(files);
        setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
    };

    useEffect(() => {
        axios.get(`/api/products/${productId}/reviews`).then((res) => {
            setReviews(res.data.reviews);
            setAvg(res.data.avg_rating);
            setTotal(res.data.total);
        });
    }, [productId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Usar FormData para suportar upload de fotos
        const fd = new FormData();
        fd.append('rating', String(data.rating));
        fd.append('title', data.title);
        fd.append('comment', data.comment);
        photoFiles.forEach(f => fd.append('images[]', f));

        post(`/produtos/${productSlug}/reviews`, {
            data: fd as never,
            forceFormData: true,
            onSuccess: () => {
                setShowForm(false);
                reset();
                setPhotoFiles([]);
                setPhotoPreviews([]);
            },
        });
    };

    return (
        <Box>
            {/* Resumo */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { sm: 'center' }, mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1 }}>{avg.toFixed(1)}</Typography>
                    <Rating value={avg} precision={0.5} readOnly />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{total} avaliação{total !== 1 ? 'ões' : ''}</Typography>
                </Box>
                <Box>
                    {auth.user ? (
                        <Button variant="outlined" onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancelar' : 'Avaliar este produto'}
                        </Button>
                    ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            <Box component="a" href="/login" sx={{ color: 'primary.main' }}>Faça login</Box> para avaliar este produto.
                        </Typography>
                    )}
                </Box>
            </Stack>

            {/* Formulário */}
            {showForm && (
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'primary.light', borderRadius: 2, mb: 3, bgcolor: 'primary.50' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Sua avaliação</Typography>
                    {wasSuccessful && <Alert severity="success" sx={{ mb: 2 }}>Avaliação enviada para moderação!</Alert>}
                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>Nota *</Typography>
                                <Rating value={data.rating} onChange={(_, v) => setData('rating', v ?? 5)} size="large" />
                            </Box>
                            <TextField label="Título (opcional)" value={data.title} onChange={(e) => setData('title', e.target.value)} fullWidth size="small" />
                            <TextField
                                label="Comentário *"
                                value={data.comment}
                                onChange={(e) => setData('comment', e.target.value)}
                                error={!!errors.comment}
                                helperText={errors.comment ?? 'Mínimo 20 caracteres'}
                                fullWidth
                                multiline
                                rows={4}
                                size="small"
                            />

                            {/* Upload de fotos */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Fotos (opcional, até 4)</Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {photoPreviews.map((src, i) => (
                                        <Box key={i} component="img" src={src} sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }} />
                                    ))}
                                    {photoPreviews.length < 4 && (
                                        <Box
                                            onClick={() => fileRef.current?.click()}
                                            sx={{
                                                width: 72, height: 72, border: '2px dashed', borderColor: 'divider',
                                                borderRadius: 1.5, display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                color: 'text.disabled', fontSize: 10,
                                                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                                            }}
                                        >
                                            <AddPhotoAlternateIcon sx={{ fontSize: 24 }} />
                                            Foto
                                        </Box>
                                    )}
                                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoChange} />
                                </Stack>
                            </Box>

                            <Button type="submit" variant="contained" disabled={processing} sx={{ alignSelf: 'flex-start' }}>
                                {processing ? 'Enviando...' : 'Enviar avaliação'}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            )}

            {/* Lista de reviews */}
            {reviews.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3 }}>
                    Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                </Typography>
            ) : (
                <Stack spacing={3}>
                    {reviews.map((review, i) => (
                        <Box key={review.id}>
                            {i > 0 && <Divider sx={{ mb: 3 }} />}
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                                        {review.author[0].toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{review.author}</Typography>
                                            {review.verified_purchase && (
                                                <Chip icon={<VerifiedIcon style={{ fontSize: 12 }} />} label="Compra verificada" size="small" color="success" sx={{ height: 20, fontSize: 10 }} />
                                            )}
                                        </Stack>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Rating value={review.rating} readOnly size="small" />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{review.created_at}</Typography>
                                        </Stack>
                                    </Box>
                                </Stack>
                                {review.title && <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{review.title}</Typography>}
                                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7 }}>{review.comment}</Typography>
                                {review.images && review.images.length > 0 && (
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {review.images.map((img, j) => (
                                            <Box
                                                key={j}
                                                component="img"
                                                src={img}
                                                alt={`Foto ${j + 1}`}
                                                onClick={() => window.open(img, '_blank')}
                                                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1.5, cursor: 'zoom-in', border: '1px solid', borderColor: 'divider', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.05)' } }}
                                            />
                                        ))}
                                    </Stack>
                                )}
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
