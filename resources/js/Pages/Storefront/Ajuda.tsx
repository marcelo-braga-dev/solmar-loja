import { Head, Link } from '@inertiajs/react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

const FAQS = [
    {
        question: 'Como acompanho o status do meu pedido?',
        answer: 'Acesse "Minha Conta" > "Meus Pedidos" para ver o status, rastreio e histórico de cada compra.',
    },
    {
        question: 'Como solicito uma devolução ou troca?',
        answer: 'Em "Minha Conta" > "Devoluções" você pode abrir uma solicitação informando o pedido e o motivo.',
    },
    {
        question: 'Quais formas de pagamento são aceitas?',
        answer: 'Aceitamos Pix, boleto bancário e cartão de crédito, com confirmação automática para Pix e cartão.',
    },
    {
        question: 'Como funciona o frete e o prazo de entrega?',
        answer: 'O frete e o prazo são calculados no checkout com base no seu CEP e no peso/dimensões dos produtos do carrinho.',
    },
    {
        question: 'Não encontrei a resposta que eu precisava, e agora?',
        answer: 'Abra um chamado de suporte na sua conta ou fale com a gente pela página de contato — respondemos em até 1 dia útil.',
    },
];

export default function Ajuda() {
    return (
        <StorefrontLayout>
            <Head title="Central de Ajuda — SolarHub" />

            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Central de Ajuda</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.85 }}>
                        Tire suas dúvidas mais comuns ou fale diretamente com nosso suporte.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: 8 }}>
                <Stack spacing={1.5} sx={{ mb: 6 }}>
                    {FAQS.map((faq) => (
                        <Accordion key={faq.question} disableGutters>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 700 }}>{faq.question}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography sx={{ color: 'text.secondary' }}>{faq.answer}</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>

                <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Ainda precisa de ajuda? Abra um chamado de suporte ou entre em contato.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button component={Link} href="/conta/suporte/criar" variant="contained" size="large">
                            Abrir chamado de suporte
                        </Button>
                        <Button component={Link} href="/contato" variant="outlined" size="large">
                            Página de contato
                        </Button>
                    </Stack>
                </Stack>
            </Container>
        </StorefrontLayout>
    );
}
