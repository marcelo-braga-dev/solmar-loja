import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import {
    Box, Button, Chip, Divider, Paper, Stack, Table, TableBody,
    TableCell, TableHead, TableRow, Typography, Alert, LinearProgress,
    FormControl, InputLabel, Select, MenuItem, alpha,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@inertiajs/react';

interface ImportLog {
    id: number;
    status: string;
    total_items: number;
    created_items: number;
    updated_items: number;
    error_items: number;
    errors: { row?: number; error: string }[] | null;
    started_at: string | null;
}

interface Props extends PageProps {
    recentImports: ImportLog[];
}

const COLUMNS = [
    { col: 'SKU', required: true,  desc: 'Código único do produto (obrigatório)' },
    { col: 'Nome', required: true, desc: 'Nome completo do produto (obrigatório)' },
    { col: 'Descricao_curta', required: false, desc: 'Resumo em até 160 caracteres' },
    { col: 'Descricao_completa', required: false, desc: 'Descrição técnica detalhada' },
    { col: 'Preco_venda_reais', required: true,  desc: 'Preço em reais, ex: 899.90' },
    { col: 'Preco_de_reais', required: false, desc: 'Preço "De" para mostrar desconto' },
    { col: 'Custo_reais', required: false, desc: 'Custo interno (não aparece ao cliente)' },
    { col: 'Status', required: false, desc: 'published | draft | archived (padrão: draft)' },
    { col: 'Marca', required: false, desc: 'Nome da marca (cria se não existir)' },
    { col: 'Categoria_slug', required: false, desc: 'Slug da categoria, ex: paineis-modulos-solares' },
    { col: 'Peso_gramas', required: false, desc: 'Peso em gramas inteiros, ex: 27800' },
    { col: 'Estoque', required: false, desc: 'Quantidade inicial em estoque' },
    { col: 'Destaque', required: false, desc: '1 para destacar, 0 para não' },
    { col: 'Meta_titulo', required: false, desc: 'Título para SEO' },
    { col: 'Meta_descricao', required: false, desc: 'Descrição para SEO' },
];

const STATUS_COLOR: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    success: 'success', partial: 'warning', failed: 'error', running: 'info',
};

const STATUS_LABEL: Record<string, string> = {
    success: 'Sucesso', partial: 'Parcial', failed: 'Falhou', running: 'Executando...',
};

export default function ProductImport({ recentImports }: Props) {
    const fileRef  = useRef<HTMLInputElement>(null);
    const [file, setFile]       = useState<File | null>(null);
    const [mode, setMode]       = useState('create_and_update');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string[][]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);

        // Preview das primeiras 5 linhas
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split('\n').slice(0, 6).map(l => l.split(',').map(v => v.replace(/^"|"$/g, '').trim()));
            setPreview(lines);
        };
        reader.readAsText(f);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('csv_file', file);
        formData.append('update_mode', mode);
        formData.append('_method', 'POST');

        router.post('/admin/products/import', formData as never, {
            forceFormData: true,
            onFinish: () => { setLoading(false); setFile(null); setPreview([]); if (fileRef.current) fileRef.current.value = ''; },
        });
    };

    return (
        <AdminLayout title="Importar Produtos via CSV" breadcrumbs={[{ label: 'Produtos', href: '/admin/products' }, { label: 'Importar CSV' }]}>
            <Head title="Importar Produtos — Admin" />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                {/* Coluna principal */}
                <Box sx={{ flex: 1 }}>
                    {/* Upload */}
                    <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, p: 3, mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Upload do Arquivo CSV</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                            Importe múltiplos produtos de uma vez. Baixe o template para ver o formato correto.
                        </Typography>

                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                        >
                            {/* Drop zone */}
                            <Box
                                onClick={() => fileRef.current?.click()}
                                sx={{
                                    border: '2px dashed',
                                    borderColor: file ? 'success.main' : 'divider',
                                    borderRadius: 2.5, p: 4,
                                    textAlign: 'center', cursor: 'pointer', mb: 2.5,
                                    bgcolor: file ? alpha('#16A34A', 0.03) : 'transparent',
                                    transition: 'all 0.15s',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#0B5FFF', 0.02) },
                                }}
                            >
                                <UploadFileIcon sx={{ fontSize: 48, color: file ? 'success.main' : 'text.disabled', mb: 1 }} />
                                {file ? (
                                    <>
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                                            ✓ {file.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {(file.size / 1024).toFixed(1)} KB — Clique para trocar
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            Clique para selecionar o arquivo CSV
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Formato: .csv ou .txt · Máx. 10 MB
                                        </Typography>
                                    </>
                                )}
                                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
                            </Box>

                            {/* Preview */}
                            {preview.length > 0 && (
                                <Box sx={{ mb: 2.5, overflowX: 'auto' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                                        Pré-visualização (primeiras {Math.min(preview.length - 1, 5)} linhas):
                                    </Typography>
                                    <Box sx={{ bgcolor: '#1E1E1E', borderRadius: 2, p: 1.5, overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    {preview[0]?.map((h, i) => (
                                                        <TableCell key={i} sx={{ color: '#9CDCFE', fontFamily: 'monospace', fontSize: 11, py: 0.5, border: 'none', whiteSpace: 'nowrap' }}>
                                                            {h}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {preview.slice(1).map((row, i) => (
                                                    <TableRow key={i}>
                                                        {row.map((cell, j) => (
                                                            <TableCell key={j} sx={{ color: '#CE9178', fontFamily: 'monospace', fontSize: 11, py: 0.3, border: 'none', whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {cell}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Box>
                            )}

                            {/* Modo de importação */}
                            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                                <InputLabel>Modo de importação</InputLabel>
                                <Select value={mode} label="Modo de importação" onChange={(e) => setMode(e.target.value)}>
                                    <MenuItem value="create_and_update">Criar novos + Atualizar existentes</MenuItem>
                                    <MenuItem value="create_only">Apenas criar novos (ignorar existentes)</MenuItem>
                                    <MenuItem value="update_existing">Apenas atualizar existentes (ignorar novos)</MenuItem>
                                </Select>
                            </FormControl>

                            {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<UploadFileIcon />}
                                    disabled={!file || loading}
                                    size="large"
                                >
                                    {loading ? 'Importando...' : 'Importar Agora'}
                                </Button>
                                <Button
                                    href="/admin/products/import/template"
                                    component="a"
                                    download
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                >
                                    Baixar Template
                                </Button>
                            </Stack>
                        </Box>
                    </Paper>

                    {/* Histórico */}
                    {recentImports.length > 0 && (
                        <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Histórico de Importações</Typography>
                            </Box>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                                        {['Status', 'Data', 'Total', 'Criados', 'Atualizados', 'Erros'].map(h => (
                                            <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', py: 1 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentImports.map(imp => (
                                        <TableRow key={imp.id} hover>
                                            <TableCell>
                                                <Chip label={STATUS_LABEL[imp.status] ?? imp.status} color={STATUS_COLOR[imp.status] ?? 'default'} size="small" sx={{ fontSize: 11 }} />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{imp.started_at ?? '—'}</TableCell>
                                            <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{imp.total_items}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>{imp.created_items}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>{imp.updated_items}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" sx={{ color: imp.error_items > 0 ? 'error.main' : 'text.secondary', fontWeight: imp.error_items > 0 ? 700 : 400 }}>{imp.error_items}</Typography></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}
                </Box>

                {/* Coluna lateral: documentação */}
                <Box sx={{ width: { md: 340 }, flexShrink: 0 }}>
                    <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, p: 2.5, position: 'sticky', top: 80 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                            <InfoIcon color="primary" sx={{ fontSize: 18 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Colunas do CSV</Typography>
                        </Stack>
                        <Stack spacing={1.2}>
                            {COLUMNS.map((col) => (
                                <Box key={col.col}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.3 }}>
                                        <Typography sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'primary.main' }}>
                                            {col.col}
                                        </Typography>
                                        {col.required && (
                                            <Chip label="Obrigatório" size="small" color="error" sx={{ height: 16, fontSize: 9 }} />
                                        )}
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>{col.desc}</Typography>
                                    <Divider sx={{ mt: 1 }} />
                                </Box>
                            ))}
                        </Stack>

                        <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
                            Use ponto (.) como separador decimal. Exemplo: <code>899.90</code>
                        </Alert>
                    </Paper>
                </Box>
            </Stack>
        </AdminLayout>
    );
}
