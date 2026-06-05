# 06 — Features do Storefront (Loja)

Objetivo macro: **converter visitantes em compradores** com uma experiência rápida, confiável e fácil.

> **Status:** Todas as features abaixo estão implementadas. Este documento serve como referência do que existe e onde está.

---

## 1. Home Page ✅

**Arquivo:** `Pages/Storefront/Home.tsx`

Seções em ordem (todas dinâmicas via props do `HomeController`):

1. **`AnnouncementBar`** — barra rotativa no topo (4 mensagens, dots, auto-rotate 4.5s, botão fechar)
2. **Hero** — gradiente `#0D1B3E → #0B5FFF`, anéis decorativos, texto com gradiente amarelo, badges flutuantes (CO₂/garantia/ICMS), CTAs com sombra dourada
3. **Benefits Bar** — 5 itens em grid horizontal com borda divisória (frete, parcelamento, garantia, suporte, compra segura)
4. **Stats Section** — 15.000+ clientes, 50MW+ instalados, 12.000+ pedidos, 25 anos garantia (fundo gradiente escuro)
5. **Categorias** — grid com gradiente por tipo (`CAT_STYLE` map), emoji, hover elevado com sombra colorida
6. **Ofertas Especiais** — produtos com desconto (badge vermelho), seção com chip "🔥 Promoções"
7. **Mais Vendidos** — produtos featured, chip "⭐ Top Produtos"
8. **Marcas Parceiras** — tags com hover colorido
9. **Testimoniais** — 3 depoimentos com nome, cidade, produto e estrelas
10. **CTA Final** — gradiente profundo com botão simulador e kits
11. **Newsletter Strip** — formulário de inscrição no footer
12. **Rodapé completo** — links, social, CNPJ, contato

---

## 2. Navegação ✅

**Arquivo:** `Layouts/StorefrontLayout.tsx`

- **AnnouncementBar** — barra rotativa acima do header
- **Top Bar** (desktop) — telefone, email, WhatsApp, frete grátis dinâmico
- **Header sticky** — logo, SmartSearch (autocomplete Meilisearch 300ms debounce), ícone carrinho (badge real), menu usuário
- **Barra de navegação** — 8 links (Energia Solar, Kits, Painéis, Inversores, Baterias, Mobilidade, Simulador, Blog)
- **Drawer mobile** — mesmos links + conta/login
- **Flash messages** — alert colorido por tipo (success, error, warning, info)
- **WhatsAppButton** — flutuante, balão de chat macOS-style, pulsing badge
- **ComparisonBar** — barra sticky no footer com produtos na comparação
- **CookieBanner** — LGPD com "apenas essenciais" e "aceitar todos"

---

## 3. Listagem por Categoria ✅

**Arquivo:** `Pages/Storefront/Category.tsx`

- **Filtros:** marca (checkbox), faixa de preço (slider), em promoção (checkbox)
- **Ordenação:** relevância, menor preço, maior preço, mais recentes
- **Chips de filtros ativos** com botão de remoção individual
- **Toggle Grid/Lista** — ícones GridView/ViewList; modo lista com foto, SKU, preço e botão "Comprar" inline
- **Contagem de resultados** e paginação com `Pagination.tsx`
- **Sidebar desktop:** `md: 3` (25%), conteúdo `md: 9`, `position: sticky; top: 80px`
- **Grid desktop:** 3 colunas (`lg: 4`) com `spacing={3}`
- **Responsivo:** drawer mobile para filtros

---

## 4. Página de Produto ✅

**Arquivo:** `Pages/Storefront/Product.tsx`

### Layout

- Grid **50/50** (`md: 6` + `md: 6`), `alignItems: 'flex-start'`
- Galeria com **`position: sticky; top: 88px`** — elimina espaço em branco quando info do produto é mais longa

### Galeria de Imagens (`ProductGallery.tsx`)

- **Thumbnails verticais** (desktop, 82px), spring animation, border-radius 12px, overlay azul no ativo
- **Imagem principal** — `object-fit: cover`, border-radius 20px, crossfade 130ms
- **Painel de zoom externo** — 500×500px, **3× ampliação**, posicionado com `left: calc(100% + 20px)` — apenas em xl+; sem cursor circular
- **Dots de progresso** — pill animado que alarga no ativo (até 10 imagens)
- **Lightbox** — backdrop 95%+blur 12px, animação spring, header pill macOS, thumbnails com hover scale, teclado (←/→/Esc)
- **Thumbnails horizontais** no mobile

### Informações do Produto

- **FlashSaleBanner** — banner vermelho com countdown HH:MM:SS (pisca <5min) + barra de unidades
- **FlashSale** verificado via `GET /api/flash-sale/{product}` (assíncrono, sem bloquear render)
- Preço, desconto, parcelamento (12x sem juros), 5% Pix
- **SocialProof** — "X pessoas vendo agora" (flutua ±1 a cada 15s), vendidos no mês, urgência de estoque (<8 unidades)
- Seleção de variantes
- Quantidade + botão "Adicionar ao Carrinho"
- Botão **"🧾 Solicitar Cotação (Grandes Volumes)"** → `QuoteModal`
- **ShippingCalculator** — CEP mask, ViaCEP, PAC/SEDEX por faixa de CEP, dica frete grátis
- Box de garantias — frete grátis dinâmico + garantia fabricante
- Barra sticky "Adicionar ao Carrinho" (aparece ao rolar >420px)

### Seções Abaixo da Galeria

- **Tabs:** Descrição, Especificações, Avaliações + Q&A
- **FrequentlyBought** — upsell com checkboxes, total dinâmico, add-all
- **Produtos Relacionados** — 3 colunas (`lg: 4`)
- **RecentlyViewed** — localStorage, máx. 8 produtos

---

## 5. Busca ✅

**Arquivo:** `Pages/Storefront/Search.tsx` | `Controllers/Storefront/SearchController.php`

- Autocomplete `SmartSearch.tsx` com debounce 300ms (throttle 60/min)
- Resultados paginados com grid de produtos
- Parâmetro `?q=` na URL

---

## 6. Carrinho ✅

**Arquivo:** `Pages/Storefront/Cart.tsx`

- Lista de itens com imagem, SKU, controle de quantidade (−/N/+), subtotal, botão remover
- **Barra de progresso frete grátis** — `LinearProgress` com `branding.free_shipping_min_cents` dinâmico
  - Mensagem "🎉 Você ganhou frete grátis!" ao atingir o mínimo
- Campo de cupom + botão aplicar
- Resumo: subtotal, frete (no checkout), total, parcelamento
- Botão "Finalizar Compra" (requer auth)

---

## 7. Checkout ✅

**Arquivo:** `Pages/Storefront/Checkout.tsx`

- Endereços salvos (com seleção) + formulário de endereço novo com busca CEP (ViaCEP)
- Seleção de método de pagamento: Pix, Boleto, Cartão
- Cria `Order` em `DB::transaction()` e inicia `Payment`

---

## 8. Pagamento ✅

**Arquivo:** `Pages/Storefront/Payment.tsx`

- **Pix:** QR Code SVG + copia-e-cola com feedback "Copiado!"
- **Boleto:** código de barras + link para PDF
- **Cartão:** aprovação imediata via MockGateway (ou Asaas em produção)

---

## 9. Área do Cliente ✅

**Layout:** `Layouts/AccountLayout.tsx` | **Controller:** `Controllers/Storefront/AccountController.php`

| Rota | Página | Descrição |
|---|---|---|
| `/conta` | `Account/Dashboard.tsx` | KPIs (pedidos/favoritos/endereços), últimos pedidos, segurança |
| `/conta/perfil` | `Account/Profile.tsx` | Dados pessoais + CPF/CNPJ + data nascimento |
| `/conta/seguranca` | `Account/Security.tsx` | Status e-mail, senha, 2FA (admin) |
| `/conta/enderecos` | `Account/Addresses.tsx` | CRUD endereços com busca CEP |
| `/conta/favoritos` | `Account/Favorites.tsx` | Grid de produtos favoritos |
| `/conta/pedidos` | `Account/Orders.tsx` | Histórico com status coloridos |
| `/conta/pedidos/{uuid}` | `Account/OrderDetail.tsx` | Detalhe + timeline visual 5 passos |
| `/conta/devolucoes` | `Account/Returns.tsx` | Histórico de devoluções |
| `/conta/devolucoes/criar` | `Account/ReturnCreate.tsx` | Formulário com upload de fotos |
| `/conta/suporte` | `Account/Tickets.tsx` | Lista de tickets |
| `/conta/suporte/criar` | `Account/TicketCreate.tsx` | Abrir novo ticket |
| `/conta/suporte/{uuid}` | `Account/TicketShow.tsx` | Thread de suporte |

### Dashboard do Cliente
- Card de saudação com gradiente e avatar com inicial
- KPI cards coloridos com gradiente por categoria
- Lista dos 3 últimos pedidos com status e total
- Dados pessoais + status de segurança lado a lado
- Grid de atalhos rápidos (4 botões)

### Timeline de Pedido
- 5 passos: Pedido Realizado → Pagamento Confirmado → Em Preparação → Enviado → Entregue
- Linha de progresso azul, step ativo com halo, steps futuros cinza
- Datas reais nos steps concluídos
- Banner vermelho separado para status cancelado/reembolsado

---

## 10. Simulador Solar ✅

**Arquivo:** `Pages/Storefront/Simulator.tsx` | `Services/Marketing/SolarSimulatorService.php`

- Wizard 3 etapas: Consumo (kWh) → Localização (27 estados) → Resultado
- Resultado: potência kWp, número de painéis, área de telhado, geração anual, economia, payback, CO₂
- **Botão "Gerar Proposta PDF"** — HTML profissional com logo, KPIs, DRE solar, análise financeira, impacto ambiental, `window.print()`
- Kit sugerido vinculado ao resultado

---

## 11. Comparação de Produtos ✅

**Rota:** `GET /comparar?ids=1,2,3`
**Arquivo:** `Pages/Storefront/Compare.tsx` | `Controllers/Storefront/CompareController.php`

- `useComparison` hook (localStorage, max 4, persist entre navegações)
- `ComparisonBar` sticky no footer com slots vazios e botão "Comparar (N)"
- Botão "Comparar" no `ProductCard` (roxo, muda para "Na comparação ✓")
- Tabela com: preço (destacado), disponibilidade, SKU, peso, specs dinâmicas
- Cells coloridas por produto, botão "Ver produto" e "Remover da comparação"

---

## 12. Kit Builder Interativo ✅

**Rota:** `GET /monte-seu-kit`
**Arquivo:** `Pages/Storefront/KitBuilder.tsx` | `Controllers/Storefront/KitBuilderController.php`

- Wizard 4 passos com Stepper visual: Painel → Inversor → Estrutura → Cabos → Resumo
- Sidebar "Seu Kit em andamento" com total e parcelamento acumulado
- Step 2: API `/api/kit-builder/inverters?panel_id=N`
- Step 3: API `/api/kit-builder/accessories` (estruturas + cabos)
- Step 4: Resumo com todos os produtos + botão "Adicionar Kit Completo ao Carrinho"
- Cada produto: avatar, marca, SKU, especificações, preço

---

## 13. Blog ✅

**Rotas:** `GET /blog`, `GET /blog/{slug}`

- Listagem paginada com busca por categoria
- Post: leitura estimada (`readingTime()`), autor, data, imagem de capa
- Posts relacionados na sidebar

---

## 14. Páginas Institucionais ✅

| Rota | Arquivo |
|---|---|
| `/sobre` | `Storefront/Sobre.tsx` |
| `/contato` | `Storefront/Contato.tsx` (com envio de e-mail) |
| `/privacidade` | `Storefront/Privacidade.tsx` (LGPD) |

---

## 15. Auth e Login Social ✅

| Rota | Descrição |
|---|---|
| `GET /register` | Cadastro com papel customer |
| `POST /login` | Login com email/senha |
| `GET /auth/google` | Redirect para Google OAuth |
| `GET /auth/google/callback` | Callback — merge por email se conta já existe |
| `GET /esqueci-minha-senha` | Recuperação via email |
| `GET /verify-email` | Verificação de email |

- Botão "Continuar com Google" com SVG real na página de Login
- `SocialiteController` faz merge de conta existente pelo email
