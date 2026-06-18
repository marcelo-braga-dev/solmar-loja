import { Head, usePage } from '@inertiajs/react';
import { Box, Container, Divider, Typography, Stack } from '@mui/material';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { SharedProps } from '@/Types/inertia';

const SECTIONS = [
    {
        title: '1. Informações que coletamos',
        content: `Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail, telefone, CPF e endereço de entrega durante o cadastro e processo de compra. Também coletamos automaticamente dados de uso, endereço IP, tipo de dispositivo e cookies para melhorar sua experiência.`,
    },
    {
        title: '2. Como usamos suas informações',
        content: `Utilizamos seus dados para: processar pedidos e pagamentos; comunicar atualizações de entrega; enviar ofertas e novidades (com seu consentimento); melhorar nossos produtos e serviços; cumprir obrigações legais e fiscais.`,
    },
    {
        title: '3. Compartilhamento de dados',
        content: `Não vendemos seus dados pessoais. Compartilhamos informações apenas com: transportadoras para entrega de pedidos; gateways de pagamento para processar transações; prestadores de serviço que operam em nosso nome (sempre com cláusulas de confidencialidade).`,
    },
    {
        title: '4. Seus direitos (LGPD)',
        content: `Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a: acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar a exclusão; revogar consentimento; e obter informações sobre o uso dos seus dados. Entre em contato pelo e-mail privacidade@solarhub.com.br.`,
    },
    {
        title: '5. Cookies',
        content: `Utilizamos cookies essenciais para o funcionamento da plataforma, cookies analíticos (com sua permissão) para entender o comportamento de navegação, e cookies de preferências para lembrar suas configurações. Você pode gerenciar cookies pelo seu navegador.`,
    },
    {
        title: '6. Segurança',
        content: `Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, incluindo criptografia SSL/TLS em todas as comunicações, armazenamento seguro de senhas (bcrypt) e acesso restrito a dados sensíveis.`,
    },
    {
        title: '7. Retenção de dados',
        content: `Mantemos seus dados pelo tempo necessário para prestar os serviços, cumprir obrigações legais (mínimo 5 anos para dados fiscais) ou conforme sua preferência. Dados de marketing são mantidos até que você cancele sua inscrição.`,
    },
    {
        title: '8. Alterações desta política',
        content: `Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas por e-mail ou aviso em destaque no site. A data da última atualização é indicada no rodapé deste documento.`,
    },
];

export default function Privacidade() {
    const { branding } = usePage<SharedProps>().props;
    const storeName = branding?.store_name || 'Nossa loja';

    return (
        <StorefrontLayout>
            <Head title="Política de Privacidade" />

            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Política de Privacidade</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.85 }}>
                        Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: 8 }}>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.8 }}>
                    {storeName} está comprometido com a proteção da sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
                </Typography>

                <Divider sx={{ mb: 4 }} />

                <Stack spacing={4}>
                    {SECTIONS.map((s) => (
                        <Box key={s.title}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{s.title}</Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>{s.content}</Typography>
                        </Box>
                    ))}
                </Stack>

                <Divider sx={{ my: 4 }} />

                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Para questões sobre privacidade: <strong>{branding?.store_email || 'contato@example.com'}</strong><br />
                    {storeName}{branding?.store_cnpj ? ` — CNPJ: ${branding.store_cnpj}` : ''}{branding?.store_address ? ` — ${branding.store_address}` : ''}
                </Typography>
            </Container>
        </StorefrontLayout>
    );
}
