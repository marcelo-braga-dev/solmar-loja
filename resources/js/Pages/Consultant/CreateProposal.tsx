import { Head, useForm, Link } from '@inertiajs/react';
import {
    Box, Typography, Button, Paper, Stack, Grid, TextField,
    Divider, IconButton, Table, TableBody, TableCell, TableHead,
    TableRow, Select, MenuItem, FormControl, InputLabel,
    Alert,
} from '@mui/material';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConsultantLayout from '@/Layouts/ConsultantLayout';
import { formatBRL } from '@/Lib/formatters';
import type { PageProps } from '@inertiajs/react';

interface ProposalItemForm {
    item_type: 'product' | 'service' | 'custom';
    product_id: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price_cents: number;
    discount_percent: number;
}

interface ExistingProposal {
    uuid: string;
    title: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    customer_city: string | null;
    customer_state: string | null;
    notes: string | null;
    valid_until: string | null;
    discount_cents: number;
    tax_cents: number;
    items: Array<{
        item_type: 'product' | 'service' | 'custom';
        product_id: number | null;
        description: string;
        unit: string;
        quantity: number;
        unit_price_cents: number;
        discount_percent: number;
    }>;
}

interface Props extends PageProps {
    proposal?: ExistingProposal;
}

const emptyItem = (): ProposalItemForm => ({
    item_type: 'custom',
    product_id: '',
    description: '',
    unit: 'un',
    quantity: 1,
    unit_price_cents: 0,
    discount_percent: 0,
});

export default function CreateProposal({ proposal }: Props) {
    const isEditing = !!proposal;

    const initialItems: ProposalItemForm[] = proposal
        ? proposal.items.map((item) => ({
            item_type: item.item_type,
            product_id: item.product_id ? String(item.product_id) : '',
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            discount_percent: item.discount_percent,
        }))
        : [emptyItem()];

    const [items, setItems] = useState<ProposalItemForm[]>(initialItems);

    const { data, setData, post, put, processing, errors } = useForm<{
        title: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        customer_city: string;
        customer_state: string;
        notes: string;
        valid_until: string;
        discount_cents: number;
        tax_cents: number;
        items: ProposalItemForm[];
    }>({
        title: proposal?.title ?? '',
        customer_name: proposal?.customer_name ?? '',
        customer_email: proposal?.customer_email ?? '',
        customer_phone: proposal?.customer_phone ?? '',
        customer_city: proposal?.customer_city ?? '',
        customer_state: proposal?.customer_state ?? '',
        notes: proposal?.notes ?? '',
        valid_until: proposal?.valid_until ?? '',
        discount_cents: proposal?.discount_cents ?? 0,
        tax_cents: proposal?.tax_cents ?? 0,
        items: initialItems,
    });

    const updateItem = (index: number, field: keyof ProposalItemForm, value: string | number) => {
        const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
        setItems(updated);
        setData('items', updated);
    };

    const addItem = () => {
        const updated = [...items, emptyItem()];
        setItems(updated);
        setData('items', updated);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        const updated = items.filter((_, i) => i !== index);
        setItems(updated);
        setData('items', updated);
    };

    const itemTotal = (item: ProposalItemForm) => {
        const discount = item.unit_price_cents * (item.discount_percent / 100);
        return Math.round((item.unit_price_cents - discount) * item.quantity);
    };

    const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0);
    const total = Math.max(0, subtotal - data.discount_cents + data.tax_cents);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && proposal) {
            put(`/consultor/propostas/${proposal.uuid}`);
        } else {
            post('/consultor/propostas');
        }
    };

    return (
        <ConsultantLayout title={isEditing ? 'Editar Proposta' : 'Nova Proposta'}>
            <Head title={isEditing ? `Editar ${proposal?.title}` : 'Nova Proposta'} />

            <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton
                    component={Link}
                    href={isEditing ? `/consultor/propostas/${proposal?.uuid}` : '/consultor/propostas'}
                    size="small"
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {isEditing ? 'Editar Proposta' : 'Nova Proposta'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Preencha os dados do cliente e os itens da proposta</Typography>
                </Box>
            </Stack>

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3}>
                            {/* Dados básicos */}
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Dados da Proposta</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            label="Título da Proposta *"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            error={!!errors.title}
                                            helperText={errors.title ?? 'Ex: Kit Fotovoltaico 5kWp Residencial'}
                                            fullWidth
                                            size="small"
                                            placeholder="Ex: Kit Solar Residencial 5kWp"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Validade"
                                            type="date"
                                            value={data.valid_until}
                                            onChange={(e) => setData('valid_until', e.target.value)}
                                            error={!!errors.valid_until}
                                            helperText={errors.valid_until}
                                            fullWidth
                                            size="small"
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Dados do cliente */}
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Dados do Cliente</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Nome / Razão Social *"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            error={!!errors.customer_name}
                                            helperText={errors.customer_name}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="E-mail"
                                            type="email"
                                            value={data.customer_email}
                                            onChange={(e) => setData('customer_email', e.target.value)}
                                            error={!!errors.customer_email}
                                            helperText={errors.customer_email ?? 'Necessário para enviar a proposta por e-mail'}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Telefone / WhatsApp"
                                            value={data.customer_phone}
                                            onChange={(e) => setData('customer_phone', e.target.value)}
                                            fullWidth
                                            size="small"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Cidade"
                                            value={data.customer_city}
                                            onChange={(e) => setData('customer_city', e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 2 }}>
                                        <TextField
                                            label="UF"
                                            value={data.customer_state}
                                            onChange={(e) => setData('customer_state', e.target.value.toUpperCase())}
                                            fullWidth
                                            size="small"
                                            slotProps={{ htmlInput: { maxLength: 2 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Itens */}
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Itens da Proposta</Typography>
                                    <Button size="small" startIcon={<AddIcon />} onClick={addItem} variant="outlined">
                                        Adicionar Item
                                    </Button>
                                </Stack>

                                {errors.items && (
                                    <Alert severity="error" sx={{ mb: 2 }}>{errors.items}</Alert>
                                )}

                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, width: 120 }}>Tipo</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Descrição *</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, width: 60 }}>Qtd</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, width: 130 }}>Preço Unit. *</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, width: 70 }}>Desc %</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, width: 110, textAlign: 'right' }}>Total</TableCell>
                                            <TableCell sx={{ width: 40 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ py: 0.5, pr: 1 }}>
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={item.item_type}
                                                            onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                                                        >
                                                            <MenuItem value="product">Produto</MenuItem>
                                                            <MenuItem value="service">Serviço</MenuItem>
                                                            <MenuItem value="custom">Personalizado</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, pr: 1 }}>
                                                    <TextField
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                        placeholder="Descrição do item"
                                                        error={!!errors[`items.${index}.description` as keyof typeof errors]}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, pr: 1 }}>
                                                    <TextField
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                                                        size="small"
                                                        fullWidth
                                                        slotProps={{ htmlInput: { min: 1 } }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, pr: 1 }}>
                                                    <TextField
                                                        type="number"
                                                        value={item.unit_price_cents ? (item.unit_price_cents / 100).toFixed(2) : ''}
                                                        onChange={(e) => updateItem(index, 'unit_price_cents', Math.round(Number(e.target.value) * 100))}
                                                        size="small"
                                                        fullWidth
                                                        placeholder="0,00"
                                                        slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, pr: 1 }}>
                                                    <TextField
                                                        type="number"
                                                        value={item.discount_percent}
                                                        onChange={(e) => updateItem(index, 'discount_percent', Math.min(100, Math.max(0, Number(e.target.value))))}
                                                        size="small"
                                                        fullWidth
                                                        slotProps={{ htmlInput: { min: 0, max: 100 } }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, textAlign: 'right' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {formatBRL(itemTotal(item))}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, pl: 0 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeItem(index)}
                                                        disabled={items.length === 1}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <Divider sx={{ my: 2 }} />

                                <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
                                    <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal:</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main', minWidth: 110, textAlign: 'right' }}>
                                            {formatBRL(subtotal)}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                                        <TextField
                                            label="Desconto geral (R$)"
                                            type="number"
                                            value={data.discount_cents ? (data.discount_cents / 100).toFixed(2) : ''}
                                            onChange={(e) => setData('discount_cents', Math.round(Number(e.target.value) * 100))}
                                            size="small"
                                            sx={{ width: 160 }}
                                            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                                        />
                                        <TextField
                                            label="Taxa / Imposto (R$)"
                                            type="number"
                                            value={data.tax_cents ? (data.tax_cents / 100).toFixed(2) : ''}
                                            onChange={(e) => setData('tax_cents', Math.round(Number(e.target.value) * 100))}
                                            size="small"
                                            sx={{ width: 160 }}
                                            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                                        />
                                    </Stack>
                                </Stack>
                            </Paper>

                            {/* Observações */}
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Observações</Typography>
                                <TextField
                                    label="Condições e observações para o cliente"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    size="small"
                                    placeholder="Prazo de entrega, condições de pagamento, serviços incluídos..."
                                />
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Sidebar */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 80 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resumo</Typography>

                            <Stack spacing={1.5} sx={{ mb: 3 }}>
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {items.length} item{items.length !== 1 ? 's' : ''}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBRL(subtotal)}</Typography>
                                </Stack>
                                {data.discount_cents > 0 && (
                                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Desconto</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>-{formatBRL(data.discount_cents)}</Typography>
                                    </Stack>
                                )}
                                {data.tax_cents > 0 && (
                                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Taxa / Imposto</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>+{formatBRL(data.tax_cents)}</Typography>
                                    </Stack>
                                )}
                                <Divider />
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        {formatBRL(total)}
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Stack spacing={1.5}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={processing}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {processing ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Proposta')}
                                </Button>
                                <Button
                                    component={Link}
                                    href={isEditing ? `/consultor/propostas/${proposal?.uuid}` : '/consultor/propostas'}
                                    variant="outlined"
                                    fullWidth
                                >
                                    Cancelar
                                </Button>
                            </Stack>

                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
                                {isEditing
                                    ? 'Alterações só podem ser feitas enquanto a proposta estiver em rascunho.'
                                    : 'A proposta será salva como rascunho. Você poderá editá-la e enviá-la ao cliente depois.'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </ConsultantLayout>
    );
}
