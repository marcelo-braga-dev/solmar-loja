# 07 — Painel Administrativo

Painel completo para gestão da loja. Acesso restrito com tripla proteção: `auth + admin + two-factor`.

> **Status:** Todas as features abaixo estão implementadas.

---

## Acesso e Segurança

- **URL:** `/admin`
- **Middleware:** `['auth', 'admin', 'two-factor']`
- **2FA TOTP** via pragmarx/google2fa (QR Code SVG sem Imagick)
- **Roles com acesso ao admin:** `admin`, `manager`, `consultant` (via `isAdmin()` que aceita ambos)
- **Todas as ações sensíveis** são auditadas via `audit_logs`

---

## Layout Sidebar

**Arquivo:** `Layouts/AdminLayout.tsx`

- Gradiente dark `#0D1B3E → #111827`
- Itens ativos: borda azul esquerda 3px + fundo `rgba(11,95,255,0.2)` + borda fina
- Card do usuário no rodapé com avatar gradiente + menu (Segurança 2FA, Sair)
- AppBar com `backdropFilter: blur(12px)` glassmorphism
- Popover de notificações com badge real e mark-as-read

### Seções do Menu

| Seção | Itens |
|---|---|
| **Geral** | Dashboard |
| **Catálogo** | Produtos, Importar CSV, Categorias, Marcas |
| **Operações** | Pedidos, Clientes |
| **Estoque** | Gestão de Estoque |
| **Marketing** | Cupons, Flash Sales, Blog — Posts, Blog — Categorias, Avaliações, Newsletter |
| **Análises** | Relatórios |
| **Atendimento** | Suporte / Tickets, Cotações, Devoluções / RMA |
| **Portal B2B** | Empresas (`/admin/companies`), Tabelas de Preço (`/admin/price-lists`) |
| **Integrações** | ERP / API Externa |
| **Sistema** | Configurações, Identidade Visual, Autenticação 2FA |

---

## 1. Dashboard ✅

**Arquivo:** `Pages/Admin/Dashboard.tsx` | `Controllers/Admin/DashboardController.php`

### KPI Cards (gradiente colorido)
- **Receita do mês** (azul) — comparativo mês anterior + sparkline 7 dias + growth %
- **Pedidos este mês** (roxo) — total + pedidos hoje
- **Produtos publicados** (verde) — contagem do catálogo
- **Clientes cadastrados** (laranja) — total + novos nos últimos 7 dias

### Gráficos Recharts
- **AreaChart** — receita diária dos últimos 30 dias com gradiente azul
- **BarChart** — novos clientes por dia (últimos 30 dias)
- **PieChart** — receita por categoria (top 5) com legenda

### Welcome Banner
- Gradiente azul profundo com saudação por horário (bom dia/tarde/noite)
- Alertas contextuais: pedidos pendentes (amarelo), estoque baixo (vermelho)
- Link rápido para Relatórios

### Quick Actions
- 6 atalhos: Novo Produto, Ver Pedidos, Estoque, Cupons, Avaliações, Relatórios

### Top Produtos
- 8 produtos com barras de progresso relativo ao líder
- Botão **"Exportar CSV"** (download direto via `Blob` client-side)

### Status dos Pedidos
- Barras de progresso por status com porcentagem e contagem

---

## 2. Catálogo ✅

### Produtos

| Rota | Controller | Função |
|---|---|---|
| `GET /admin/products` | ProductController@index | Listagem com busca, **checkboxes**, toolbar de bulk actions |
| `GET /admin/products/create` | ProductController@create | Formulário de criação |
| `POST /admin/products` | ProductController@store | Criar produto |
| `GET /admin/products/{uuid}/edit` | ProductController@edit | Edição com upload de imagens |
| `PUT /admin/products/{uuid}` | ProductController@update | Atualizar produto |
| `DELETE /admin/products/{uuid}` | ProductController@destroy | Soft delete |
| `POST /admin/products/{uuid}/publish` | ProductController@publish | Publicar |
| `POST /admin/products/{uuid}/unpublish` | ProductController@unpublish | Despublicar |
| `POST /admin/products/bulk` | BulkProductController@bulk | Bulk actions |

#### Bulk Actions
- Checkboxes em cada linha + selecionar todos no header
- Toolbar contextual com chip contador
- Ações: Publicar, Arquivar, Marcar/Remover Destaque, Excluir (com confirmação)
- Feedback via Snackbar + `router.reload()`

#### Upload de Imagens
- Dropzone clicável + input `multiple` oculto
- Upload assíncrono via `fetch` sem recarregar a página
- Thumbnails 96×96 com borda azul na capa, hover mostra botão vermelho de exclusão
- `is_cover` badge visível

### Importação CSV de Produtos

| Rota | Função |
|---|---|
| `GET /admin/products/import` | Página de importação |
| `POST /admin/products/import` | Processar CSV |
| `GET /admin/products/import/template` | Download do template |

- Dropzone com pré-visualização das primeiras 5 linhas (syntax dark theme)
- 3 modos: criar apenas, atualizar apenas, criar e atualizar
- 15 colunas: SKU\*, Nome\*, Preco_venda_reais\*, e mais
- Resolução automática de marca e categoria
- Histórico de importações com status

### Categorias
- CRUD completo com árvore até 4 níveis
- `slug`, `icon`, `position`, `is_active`, `parent_id`
- Eager loading de 4 níveis (`children.children.children.children`)

### Marcas
- CRUD básico com `is_active`

---

## 3. Pedidos ✅

**Arquivo:** `Pages/Admin/Orders/Index.tsx` + `Show.tsx`

| Rota | Função |
|---|---|
| `GET /admin/orders` | Listagem com filtros de status |
| `GET /admin/orders/{uuid}` | Detalhe completo |
| `PATCH /admin/orders/{uuid}/status` | Troca de status (máquina de estados) |
| `POST /admin/orders/{uuid}/shipment` | Registrar expedição + código de rastreamento |

- Status coloridos com `OrderStatus` enum e `canTransitionTo()`
- Detalhe: itens, totais, endereço de entrega, histórico de pagamentos
- Expedição com carrier, código de rastreamento, data

---

## 4. Clientes ✅

| Rota | Função |
|---|---|
| `GET /admin/customers` | Listagem com busca |
| `GET /admin/customers/{user}` | Perfil 360°: pedidos, endereços, total gasto |

---

## 5. Estoque ✅

| Rota | Função |
|---|---|
| `GET /admin/inventory` | DataTable com SKU, status, marca, estoque |
| `POST /admin/inventory/adjust` | Ajuste manual com motivo e registro em `stock_movements` |

- Status em português (Publicado/Rascunho) via `status_label`

---

## 6. Marketing ✅

### Cupons

| Rota | Função |
|---|---|
| `GET /admin/coupons` | Listagem com DataTable |
| `POST /admin/coupons` | Criar cupom |
| `PATCH /admin/coupons/{coupon}/toggle` | Ativar/desativar |
| `DELETE /admin/coupons/{coupon}` | Excluir |

- 3 tipos: Porcentagem, Valor fixo (R$), Frete grátis
- Inputs com `R$` e `%` adornment, conversão automática centavos/reais
- Campos: código, tipo, valor, pedido mínimo (R$), máx. usos, validade

### Flash Sales

| Rota | Função |
|---|---|
| `GET /admin/flash-sales` | Listagem com countdown ao vivo |
| `POST /admin/flash-sales` | Criar flash sale |
| `PATCH /admin/flash-sales/{id}/toggle` | Ativar/desativar |
| `DELETE /admin/flash-sales/{id}` | Excluir |

- Countdown por segundo com CSS blink nos últimos 5 minutos
- Barra de progresso de unidades (sold/max)
- Status: Executando, Agendada, Inativa

### Reviews e Q&A

| Rota | Função |
|---|---|
| `GET /admin/reviews` | Tabs: Avaliações / Perguntas |
| `PATCH /admin/reviews/{id}/approve` | Aprovar review |
| `PATCH /admin/reviews/{id}/reject` | Rejeitar review |
| `POST /admin/questions/{id}/answer` | Responder pergunta |

- Reviews podem ter até 4 fotos (galeria inline)
- Badges de pendentes nas tabs

### Blog

| Rota | Função |
|---|---|
| `GET /admin/posts` | Listagem com busca e filtro de status |
| `GET /admin/posts/create` | Criar post |
| `PUT /admin/posts/{id}` | Editar post |
| `DELETE /admin/posts/{id}` | Soft delete |
| `GET /admin/post-categories` | CRUD de categorias do blog |

### Newsletter

| Rota | Função |
|---|---|
| `GET /admin/newsletter` | Listagem com KPIs e filtros |
| `DELETE /admin/newsletter/{id}` | Remover inscrito |
| `GET /admin/newsletter/export` | Exportar CSV |

---

## 7. Análises e Relatórios ✅

**Arquivo:** `Pages/Admin/Reports/Index.tsx`

- **3 tabs:** Vendas por dia · DRE · Exportar CSV
- **KPIs:** receita total, pedidos, ticket médio, cancelados
- **AreaChart** — receita por dia com seletor de período
- **Tabela top produtos** — receita, quantidade
- **DRE simplificado** — receita bruta, despesas, resultado líquido
- **Exportar CSV** — pedidos ou DRE para arquivo no servidor
- **Botão "Exportar PDF"** — gera HTML formatado via `window.print()` com:
  - Logo + cabeçalho gradiente, KPIs em grid, DRE, top 10 produtos, receita por dia

---

## 8. Configurações ✅

| Rota | Função |
|---|---|
| `GET /admin/settings` | 16 configurações em 4 grupos |
| `PUT /admin/settings` | Salvar (invalida cache) |
| `GET /admin/branding` | Identidade visual (logo, cores, redes sociais) |
| `POST /admin/branding` | Upload de logotipo e favicon |

Grupos de settings:
- **Geral:** nome, tagline, descrição, e-mail, telefone, endereço, CNPJ
- **Frete:** `free_shipping_enabled`, `free_shipping_min_cents` (lido dinamicamente pelo frontend)
- **Pagamentos:** configurações do gateway
- **Redes Sociais:** Instagram, Facebook, YouTube, LinkedIn, WhatsApp

---

## 9. Atendimento ✅

### Cotações

| Rota | Função |
|---|---|
| `GET /admin/quotes` | Listagem com KPIs (pendentes, total, aceitas) |
| `GET /admin/quotes/{uuid}` | Detalhe com itens e formulário de resposta |
| `PUT /admin/quotes/{uuid}` | Atualizar status, valor, desconto, notas |

Status flow: `pending → reviewing → sent → accepted → rejected`

### Devoluções / RMA

| Rota | Função |
|---|---|
| `GET /admin/returns` | Listagem com KPIs |
| `GET /admin/returns/{uuid}` | Detalhe com fotos e formulário de aprovação |
| `PATCH /admin/returns/{uuid}/status` | Atualizar status + timestamps automáticos |

Status flow: `requested → approved → received → refunded` (ou `rejected`)

### Suporte / Tickets

| Rota | Função |
|---|---|
| `GET /admin/tickets` | Listagem com filtros status/prioridade e KPIs |
| `GET /admin/tickets/{uuid}` | Thread completa com resposta inline |
| `POST /admin/tickets/{uuid}/reply` | Responder (muda status para "waiting") |
| `PATCH /admin/tickets/{uuid}/status` | Alterar status manualmente |

Prioridades: Baixa, Normal, Alta, Urgente
Status: Aberto, Em andamento, Aguardando, Resolvido, Fechado

---

## 10. Integração ERP / API Externa ✅

**Arquivo:** `Pages/Admin/Integration/Index.tsx` | `Controllers/Admin/IntegrationController.php`

| Rota | Função |
|---|---|
| `GET /admin/integration` | Painel principal (4 tabs) |
| `POST /admin/integration/test-connection` | Testar conectividade com a API |
| `POST /admin/integration/sync` | Sincronização manual imediata |
| `DELETE /admin/integration/logs` | Limpar logs >30 dias |
| `GET /admin/integration/schema` | Download do schema JSON |

### Tabs do Painel

1. **Status & Configuração** — semáforo visual de variáveis, bloco de código `.env`, guia de configuração
2. **Histórico de Sincronizações** — tabela com status, duração, totais criados/atualizados/erros inline
3. **Schema JSON da API** — viewer interativo syntax highlighting (5 seções), download `.json`
4. **Mapeamento de Campos** — tabela campos externos → internos (tipos, conversões, obrigatoriedade)

### Schema JSON (solarhub-api-schema.json)

Documenta para o distribuidor o formato esperado:
- `GET /health` — verificação de disponibilidade
- `GET /products` — listagem paginada com `page`, `per_page`, `active`, `updated_since`
- Campos obrigatórios: id, sku, name, price, stock
- Campos opcionais: description, images, weight, specifications, brand, category
- Exemplo de resposta completo com produto solar real
- Webhook opcional: `POST /webhooks/erp`

---

## 11. Portal B2B — Empresas ✅

**Arquivo:** `Pages/Admin/Companies/Index.tsx` | `Controllers/Admin/CompanyController.php`

| Rota | Função |
|---|---|
| `GET /admin/companies` | Listagem com KPIs (pendentes/ativos/total), filtros, aprovação rápida inline |
| `GET /admin/companies/{uuid}` | Detalhe: membros, projetos, condições comerciais |
| `POST /admin/companies/{uuid}/approve` | Aprovar + atribuir tabela de preço automática |
| `POST /admin/companies/{uuid}/reject` | Reprovar cadastro |
| `POST /admin/companies/{uuid}/suspend` | Suspender empresa ativa |
| `PATCH /admin/companies/{uuid}/commercial` | Editar condições comerciais (tabela, crédito, prazo, desconto extra) |

### Fluxo de Aprovação
1. Empresa se cadastra em `/portal-b2b/cadastrar` → status `pending`
2. Admin visualiza na listagem com filtro "Aguardando"
3. Aprovação rápida inline ou via página de detalhe
4. Ao aprovar: tabela de preço atribuída automaticamente por tipo de empresa
   - `integrador` / `engenharia` / `revendedor` → tabela `INTEGRADOR`
   - `distribuidor` → tabela `DISTRIB`
5. Todos os usuários da empresa recebem a tabela via `price_list_id`

### KPIs da Listagem
- Aguardando aprovação (amarelo)
- Empresas ativas (verde)
- Total cadastrado (azul)

---

## 12. Tabelas de Preço ✅

**Arquivo:** `Pages/Admin/PriceLists/Index.tsx` | `Controllers/Admin/PriceListController.php`

| Rota | Função |
|---|---|
| `GET /admin/price-lists` | Cards visuais + tabela resumo de todas as tabelas |
| `POST /admin/price-lists` | Criar nova tabela |
| `PUT /admin/price-lists/{id}` | Editar tabela (não afeta tabelas padrão) |
| `DELETE /admin/price-lists/{id}` | Excluir (bloqueado para is_default) |
| `POST /admin/price-lists/{id}/product-price` | Definir preço customizado por produto |
| `DELETE /admin/price-lists/{id}/product-price/{productId}` | Remover preço customizado |
| `GET /admin/price-lists/{id}/product-prices` | Listar preços customizados da tabela |

### Tabelas Padrão (seeded, não editáveis)

| Código | Tipo | Desconto | Para quem |
|---|---|---|---|
| PUBLICO | retail | 0% | Clientes gerais, guest |
| CONSULTOR | consultant | −12% | Usuários com role `consultant` |
| INTEGRADOR | wholesale | −18% | Empresas B2B integrador/engenharia/revendedor |
| DISTRIB | wholesale | −25% | Distribuidores regionais |

### Cards Visuais
- Barra colorida no topo por tipo (azul/roxo/verde/laranja)
- Desconto em destaque: −N% grande ou "Cheio"
- Contador de preços customizados
- Botão Editar (desabilitado para padrões)

---

## 13. Notificações In-App ✅

Notificações database (Laravel Notifications):

| Evento | Notificação |
|---|---|
| Novo pedido criado | NewOrderNotification para todos os admins |
| Pagamento falhou | PaymentFailedNotification para todos os admins |
| Estoque baixo (≤5 unidades) | LowStockNotification para todos os admins |

- Badge real no ícone de sino (compartilhado via `HandleInertiaRequests`)
- Popover com lista de notificações, link de ação, mark as read / mark all read
- `NotificationController` expõe JSON via `GET /admin/notifications`
