import { Head, Link } from '@inertiajs/react';
import {
    Box, Typography, Button, Paper, Stack, Chip, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ConsultantLayout from '@/Layouts/ConsultantLayout';
import Pagination from '@/Components/storefront/Pagination';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';
import type { PaginatedData } from '@/Types/catalog';

interface ProposalRow {
    uuid: string;
    reference: string;
    title: string;
    customer_name: string;
    customer_city?: string;
    customer_state?: string;
    status: string;
    status_label: string;
    status_color: string;
    total_cents: number;
    valid_until?: string;
    created_at: string;
}

interface Props extends PageProps {
    proposals: PaginatedData<ProposalRow>;
}

export default function Proposals({ proposals }: Props) {
    return (
        <ConsultantLayout title="Propostas">
            <Head title="Propostas — Consultor" />

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Propostas</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {proposals.total} proposta{proposals.total !== 1 ? 's' : ''} no total
                    </Typography>
                </Box>
                <Button
                    component={Link}
                    href="/consultor/propostas/criar"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ fontWeight: 700 }}
                >
                    Nova Proposta
                </Button>
            </Stack>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Referência</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Título / Cliente</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Validade</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Criada em</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, width: 60 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {proposals.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Nenhuma proposta encontrada. Crie a sua primeira proposta!
                                        </Typography>
                                        <Button
                                            component={Link}
                                            href="/consultor/propostas/criar"
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            sx={{ mt: 2, fontWeight: 700 }}
                                        >
                                            Nova Proposta
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : proposals.data.map((p) => (
                                <TableRow key={p.uuid} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                            {p.reference}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.title}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {p.customer_name}
                                            {p.customer_city && ` · ${p.customer_city}/${p.customer_state}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={p.status_label}
                                            size="small"
                                            sx={{
                                                bgcolor: `${p.status_color}.50`,
                                                color: `${p.status_color}.main`,
                                                fontWeight: 600,
                                                fontSize: 11,
                                                border: '1px solid',
                                                borderColor: `${p.status_color}.200`,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {formatBRL(p.total_cents)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: p.valid_until ? 'text.primary' : 'text.secondary' }}>
                                            {p.valid_until ?? '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {p.created_at}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Ver proposta">
                                            <IconButton
                                                component={Link}
                                                href={`/consultor/propostas/${p.uuid}`}
                                                size="small"
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {proposals.last_page > 1 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination pagination={proposals} />
                </Box>
            )}
        </ConsultantLayout>
    );
}
