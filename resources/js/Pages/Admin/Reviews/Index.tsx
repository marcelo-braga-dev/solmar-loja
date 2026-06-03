import { Head, useForm, router } from '@inertiajs/react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Tabs, TextField, Typography, Rating,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/storefront/Pagination';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface ReviewRow {
    id: number;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    reviewer_name: string | null;
    verified_purchase: boolean;
    created_at: string;
    product: { id: number; name: string; slug: string };
    user: { id: number; name: string } | null;
}

interface QuestionRow {
    id: number;
    question: string;
    status: string;
    asker_name: string | null;
    created_at: string;
    product: { id: number; name: string };
    user: { id: number; name: string } | null;
    answers: Array<{ id: number; answer: string; is_official: boolean }>;
}

interface Stats { pending_reviews: number; pending_questions: number }

interface Props extends PageProps {
    reviews: PaginatedData<ReviewRow>;
    questions: PaginatedData<QuestionRow>;
    stats: Stats;
    filters: Record<string, string>;
}

const STATUS_CHIP: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'default' }> = {
    pending:  { label: 'Pendente',  color: 'warning' },
    approved: { label: 'Aprovado',  color: 'success' },
    rejected: { label: 'Rejeitado', color: 'error'   },
    answered: { label: 'Respondido', color: 'success' },
    hidden:   { label: 'Oculto',    color: 'default'  },
};

export default function ReviewsIndex({ reviews, questions, stats, filters }: Props) {
    const [tab, setTab] = useState(0);
    const [answerDialog, setAnswerDialog] = useState<QuestionRow | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({ answer: '' });

    const handleApprove = (id: number) => router.patch(`/admin/reviews/${id}/approve`);
    const handleReject  = (id: number) => router.patch(`/admin/reviews/${id}/reject`);

    const handleAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!answerDialog) return;
        post(`/admin/questions/${answerDialog.id}/answer`, {
            onSuccess: () => { setAnswerDialog(null); reset(); },
        });
    };

    return (
        <AdminLayout>
            <Head title="Avaliações e Perguntas — Admin" />

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Avaliações e Perguntas</Typography>
                <Stack direction="row" spacing={1}>
                    {stats.pending_reviews > 0 && (
                        <Chip label={`${stats.pending_reviews} avaliações pendentes`} color="warning" size="small" />
                    )}
                    {stats.pending_questions > 0 && (
                        <Chip label={`${stats.pending_questions} perguntas pendentes`} color="warning" size="small" />
                    )}
                </Stack>
            </Stack>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`Avaliações (${reviews.total})`} />
                <Tab label={`Perguntas (${questions.total})`} />
            </Tabs>

            {tab === 0 && (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                                <TableCell>Produto</TableCell>
                                <TableCell>Avaliador</TableCell>
                                <TableCell>Nota</TableCell>
                                <TableCell>Comentário</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Data</TableCell>
                                <TableCell>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reviews.data.map((review) => (
                                <TableRow key={review.id} hover>
                                    <TableCell sx={{ maxWidth: 180 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                            {review.product.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{review.reviewer_name ?? review.user?.name ?? 'Anônimo'}</Typography>
                                        {review.verified_purchase && (
                                            <Chip label="Compra verificada" size="small" color="success" variant="outlined" sx={{ mt: 0.5 }} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Rating value={review.rating} readOnly size="small" />
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 240 }}>
                                        {review.title && <Typography variant="body2" sx={{ fontWeight: 600 }}>{review.title}</Typography>}
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>{review.comment}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={STATUS_CHIP[review.status]?.label ?? review.status}
                                            color={STATUS_CHIP[review.status]?.color ?? 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">{new Date(review.created_at).toLocaleDateString('pt-BR')}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {review.status !== 'approved' && (
                                                <Button size="small" color="success" startIcon={<CheckIcon />} onClick={() => handleApprove(review.id)}>
                                                    Aprovar
                                                </Button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <Button size="small" color="error" startIcon={<CloseIcon />} onClick={() => handleReject(review.id)}>
                                                    Rejeitar
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {reviews.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma avaliação encontrada.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Box sx={{ p: 2 }}>
                        <Pagination pagination={reviews} />
                    </Box>
                </TableContainer>
            )}

            {tab === 1 && (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: 13 } }}>
                                <TableCell>Produto</TableCell>
                                <TableCell>Pergunta</TableCell>
                                <TableCell>Perguntador</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Data</TableCell>
                                <TableCell>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {questions.data.map((q) => (
                                <TableRow key={q.id} hover>
                                    <TableCell sx={{ maxWidth: 180 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{q.product.name}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        <Typography variant="body2">{q.question}</Typography>
                                        {q.answers.length > 0 && (
                                            <Box sx={{ mt: 1, pl: 1, borderLeft: '2px solid', borderColor: 'primary.main' }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Resposta: {q.answers[0].answer}
                                                </Typography>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{q.asker_name ?? q.user?.name ?? 'Anônimo'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={STATUS_CHIP[q.status]?.label ?? q.status}
                                            color={STATUS_CHIP[q.status]?.color ?? 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">{new Date(q.created_at).toLocaleDateString('pt-BR')}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {q.status === 'pending' && (
                                            <Button size="small" startIcon={<ReplyIcon />} onClick={() => setAnswerDialog(q)}>
                                                Responder
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {questions.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma pergunta encontrada.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Box sx={{ p: 2 }}>
                        <Pagination pagination={questions} />
                    </Box>
                </TableContainer>
            )}

            {/* Dialog de resposta */}
            <Dialog open={!!answerDialog} onClose={() => { setAnswerDialog(null); reset(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Responder pergunta</DialogTitle>
                <DialogContent>
                    {answerDialog && (
                        <Box component="form" id="answer-form" onSubmit={handleAnswer} sx={{ mt: 1 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <strong>Pergunta:</strong> {answerDialog.question}
                            </Alert>
                            {errors.answer && <Alert severity="error" sx={{ mb: 2 }}>{errors.answer}</Alert>}
                            <TextField
                                label="Resposta oficial"
                                multiline
                                rows={4}
                                value={data.answer}
                                onChange={(e) => setData('answer', e.target.value)}
                                fullWidth
                                autoFocus
                                helperText="Esta resposta será exibida publicamente como resposta oficial da loja."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setAnswerDialog(null); reset(); }}>Cancelar</Button>
                    <Button form="answer-form" type="submit" variant="contained" disabled={processing}>
                        Publicar resposta
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
