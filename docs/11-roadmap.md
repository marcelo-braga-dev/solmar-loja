# 11 — Roadmap e Status

Guia de fases de construção e status atual da plataforma. Todas as fases originais estão concluídas, mais dezenas de extras.

---

## Status Global: Plataforma MVP+ Completa ✅

| Fase | Descrição | Status |
|---|---|---|
| 0 | Fundação (Docker, DDD, Tema, Storage) | ✅ Concluída |
| 1 | Catálogo (Produtos, Categorias, Marcas) | ✅ Concluída |
| 2 | Auth + Clientes + Login Social | ✅ Concluída |
| 3 | Carrinho e Checkout | ✅ Concluída |
| 4 | Pagamentos (Mock + Asaas) | ✅ Concluída |
| 5 | Admin Operacional + Bulk Actions | ✅ Concluída |
| 6 | Sync de Estoque + Alertas de Volta | ✅ Concluída |
| 7 | Financeiro (DRE, Transações) | ✅ Concluída |
| 8 | Marketing (Cupons, Flash Sales, Reviews+Fotos, Blog, Kit Builder) | ✅ Concluída |
| 9 | SEO, Performance, Config, Relatórios+PDF | ✅ Concluída |
| 10 | Tabelas de Preço (Price Lists B2B) | ✅ Concluída |
| 11 | Painel do Consultor | ✅ Concluída |
| 12 | Portal B2B para Integradores/Distribuidores | ✅ Concluída |
| Extras | Ver lista completa abaixo | ✅ Implementados |

---

## Extras Implementados (Além do Roadmap Original)

### Design e UX
- [x] **Redesign completo da Homepage** — hero animado, stats section, categorias com gradiente, testimoniais
- [x] **Redesign AdminLayout** — sidebar dark gradient, card de usuário, glassmorphism appbar
- [x] **Redesign Dashboard Admin** — gráficos Recharts (AreaChart, BarChart, PieChart), KPIs gradiente
- [x] **ProductCard redesign** — hover lift, overlay "Ver produto", badge destaque, feedback add-cart
- [x] **Galeria de imagens profissional** — thumbnails verticais, zoom externo 3×, lightbox spring, sticky
- [x] **Barra de anúncios rotativa** (AnnouncementBar)
- [x] **Botão WhatsApp flutuante** com balão de chat
- [x] **Frete grátis dinâmico** — lido do SettingsService, não mais hardcoded
- [x] **Toggle Grid/Lista** na página de categoria
- [x] **Barra de progresso de frete grátis** no carrinho

### Funcionalidades de Negócio
- [x] **Comparação de Produtos** — hook + barra + página /comparar com specs
- [x] **Flash Sales com Countdown** — countdown por segundo, barra de unidades, banner na página do produto
- [x] **Upsell / Frequentemente Comprados Juntos** — co-ocorrência real + relações manuais
- [x] **Cotação / Orçamento** — modal, admin, email de notificação
- [x] **Gestão de Devoluções / RMA** — fluxo completo (5 status), fotos, admin
- [x] **Sistema de Suporte / Tickets** — thread cliente-admin, prioridades, status flow
- [x] **Recuperação de Carrinho Abandonado** — email automático hourly
- [x] **Alertas de Volta ao Estoque** — subscription + email quando volta
- [x] **Login Social Google** — merge de conta por email
- [x] **Avaliações com Fotos** — upload até 4 fotos, galeria nas reviews
- [x] **Gerador de Proposta Solar PDF** — HTML profissional via window.print()
- [x] **Kit Builder Interativo** — wizard 4 passos com sidebar de total acumulado
- [x] **Importação CSV de Produtos** — 3 modos, 15 colunas, pré-visualização, histórico
- [x] **Bulk Actions admin** — publicar/arquivar/destacar/excluir produtos em massa
- [x] **Social Proof** — pessoas vendo agora, vendidos no mês, urgência de estoque
- [x] **Calculadora de Frete** — CEP, ViaCEP, PAC/SEDEX por região
- [x] **Barra sticky Add to Cart** — aparece ao rolar >420px na página do produto
- [x] **Integração ERP/API Externa** — painel completo com schema JSON e histórico
- [x] **Timeline Visual de Pedido** — 5 passos com progresso animado
- [x] **Exportação PDF de Relatórios** — HTML formatado via window.print()
- [x] **Tabelas de Preço (Price Lists)** — 4 tabelas (Público/Consultor/Integrador/Distribuidor), desconto por %, admin CRUD, propagação automática via user/empresa/role
- [x] **Painel do Consultor** — layout dedicado, dashboard com KPIs, meta mensal, gráfico de propostas, role `consultant`
- [x] **Portal B2B** — cadastro de empresa por CNPJ, fluxo de aprovação, tabela de preço automática, gestão de projetos/obras
- [x] **Propostas Comerciais (estrutura base)** — modelos Proposal + ProposalItem + Service, status flow completo, referência PROP-XXXXXX

---

## Próximos Passos Sugeridos

### 🔴 Crítico para Produção

| Tarefa | Esforço | Impacto |
|---|---|---|
| Configurar Asaas (PAYMENT_GATEWAY=asaas) | Baixo | 🔴 Crítico |
| Configurar ERP real (ERP_BASE_URL + mapProduct()) | Médio | 🔴 Crítico |
| Configurar Google OAuth (Google Console) | Baixo | 🟠 Alto |
| Integração Notas Fiscais (Focus NFe / NFe.io) | Alto | 🔴 Crítico B2B |

### 🟠 Alta Prioridade

| Tarefa | Esforço | Impacto |
|---|---|---|
| **Proposta Comercial — UI completa** (criar, editar, enviar, PDF, aceite público) | Alto | 🟠 Alto |
| Testes Feature para funcionalidades novas | Alto | 🟠 Alto |
| Email sequences pós-compra | Médio | 🟠 Alto |
| Conciliação financeira (Asaas × pedidos) | Médio | 🟠 Alto |
| Notificações Push (browser API) | Médio | 🟡 Médio |

### 🟡 Média Prioridade

| Tarefa | Esforço | Impacto |
|---|---|---|
| Portal B2B — Dashboard da empresa (crédito, projetos, histórico) | Médio | 🟡 Médio |
| Portal Consultor — Lista de Clientes + Criação de Proposta | Médio | 🟡 Médio |
| PWA (manifest.json + Service Worker) | Médio | 🟡 Médio |
| Rastreamento Correios API (SRO) | Médio | 🟡 Médio |
| PHPStan nível 8 | Baixo | 🟢 Baixo |
| Wishlist compartilhável (URL pública) | Baixo | 🟡 Médio |

### 🟢 Baixa Prioridade / Futuro

| Tarefa | Esforço | Impacto |
|---|---|---|
| Busca por voz | Alto | 🟢 Baixo |
| A/B Testing de layouts | Alto | 🟡 Médio |
| Multi-armazém (multi-warehouse) | Alto | 🟢 Baixo |
| Tabela de compatibilidade entre produtos | Médio | 🟡 Médio |
| Blog com calculadora inline embutida | Alto | 🟢 Baixo |
| Pagamento Recorrente (assinaturas) | Alto | 🟢 Baixo |
| Gift Cards | Médio | 🟡 Médio |

---

## Notas de Decisões Arquiteturais Tomadas

| Decisão | Data | Motivo |
|---|---|---|
| Storage local (sem S3) | 2026-06-01 | Usuário não usa S3 — discos local suficiente |
| MUI 9 (não 6) | 2026-06-01 | Versão mais recente disponível — `sx` prop obrigatório |
| Vite 8 com rolldown | 2026-06-01 | Node 22 LTS instalado, máximo de performance |
| `ReturnRequest` (não `Return`) | 2026-06-03 | PHP reserva a palavra `return` |
| Sem `using(Pivot::class)` em favorites | 2026-06-02 | Tabela sem `updated_at` causaria erro |
| Galeria `object-fit: cover` | 2026-06-03 | Imagens devem preencher toda a área (sem borda branca) |
| Galeria sticky `top: 88px` | 2026-06-03 | Elimina espaço em branco — galeria acompanha scroll da info |
| Zoom externo apenas em xl+ | 2026-06-03 | Em telas menores o painel de 500px não tem espaço |
| Co-ocorrência para FrequentlyBought | 2026-06-03 | Dados reais de order_items com fallback manual |
| PDF via window.print() | 2026-06-03 | Zero dependências, funciona offline, alta qualidade |
| Google OAuth merge por email | 2026-06-03 | Evita duplicação de contas |
| Frete grátis via SettingsService | 2026-06-02 | Admin configura sem deploy; lido via HandleInertiaRequests |
| Consultor NÃO é "Vendedor" | 2026-06-04 | Terminologia definida pelo negócio — sempre `consultant`/Consultor |
| `isAdmin()` retorna true para `consultant` | 2026-06-04 | Consultores podem acessar `/admin` para ver pedidos/produtos |
| Tabela de preço por cadeia de prioridade | 2026-06-04 | Explícita → empresa → role → null (público) — máxima flexibilidade |
| Aprovação B2B auto-atribui tabela | 2026-06-04 | Integrador → INTEGRADOR (−18%), Distribuidor → DISTRIB (−25%) |
| Layout separado `/consultor` | 2026-06-04 | Consultor tem UX própria; não mistura com admin geral |
