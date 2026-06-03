# 11 — Roadmap e Status

Guia de ordem de construção e status atual. Cada fase entrega valor e mantém o sistema sempre funcional e testado.

---

## Status Global: Plataforma MVP+ Completa ✅

| Fase | Descrição | Status |
|------|-----------|--------|
| 0 | Fundação (infra, DI, temas, layouts) | ✅ Completo |
| 1 | Catálogo (produtos, categorias, busca) | ✅ Completo |
| 2 | Auth + Clientes (2FA, favoritos, endereços) | ✅ Completo |
| 3 | Carrinho + Checkout | ✅ Completo |
| 4 | Pagamentos (Pix, Boleto, Cartão, Asaas) | ✅ Completo |
| 5 | Admin Operacional (pedidos, estoque, clientes) | ✅ Completo |
| 6 | Sincronização de Estoque (ERP, HttpErpClient) | ✅ Completo |
| 7 | Financeiro (DRE, Fluxo de Caixa, CSV Export) | ✅ Completo |
| 8 | Marketing (Cupons, Blog, Newsletter, Simulador, Reviews) | ✅ Completo |
| 9 | SEO, Performance, Segurança, LGPD | ✅ Completo |
| Extras | Notificações, 2FA Admin, Páginas institucionais, Cookie consent | ✅ Completo |

---

## Fase 0 — Fundação ✅

- Laravel 12 + Sail com MySQL, Redis, Meilisearch, Mailpit, phpMyAdmin
- Estrutura de domínios em `app/Domains/` (13 domínios)
- Providers: `RepositoryServiceProvider`, `EventServiceProvider`, `HorizonServiceProvider`, `TelescopeServiceProvider`
- Value Object `Money`, tema MUI (azul `#0B5FFF`, amarelo `#FFB300`)
- `StorefrontLayout`, `AdminLayout`, `AccountLayout`
- `composer check` (Pint + PHPStan nível 6 + Pest)

---

## Fase 1 — Catálogo ✅

- Migrations: `categories`, `brands`, `attributes`, `products`, `product_images`, `product_variants`
- Models + Repositories + Services + DTOs para todas as entidades
- Admin: CRUD completo (produtos, categorias, marcas, imagens com upload)
- Storefront: Home, listagem por categoria com filtros, página de produto com galeria
- Busca Meilisearch + autocomplete com debounce 300ms
- `ProductCard` com favorito, botão add-to-cart e vistos recentemente

---

## Fase 2 — Auth + Clientes ✅

- Registro, login, logout, recuperação de senha, verificação de e-mail
- 2FA TOTP para administradores (`pragmarx/google2fa-laravel`)
- `Customer`, `Address` com busca de CEP via ViaCEP
- Área do cliente: dashboard, perfil, endereços, favoritos, pedidos
- 6 roles + 26 permissões via Spatie Permission

---

## Fase 3 — Carrinho e Checkout ✅

- Carrinho para visitante + logado com merge pós-login
- Cupons (3 tipos: percentual, fixo, frete grátis)
- Checkout com seleção de endereço salvo ou novo
- Segurança: IDOR fix (CartItem verifica ownership antes de update/destroy)

---

## Fase 4 — Pagamentos ✅

- `PaymentGatewayInterface` com `MockGateway` (dev) e `AsaasGateway` (produção)
- Pix com QR Code SVG, Boleto, Cartão de crédito
- Webhooks idempotentes com verificação de assinatura (Asaas: header `asaas-access-token`)
- Eventos: `PaymentApproved` → baixa estoque + cria transação financeira

---

## Fase 5 — Admin Operacional ✅

- Pedidos: listagem com filtros, detalhe, troca de status com máquina de estados
- Clientes: perfil 360° (pedidos, endereços, total gasto)
- Estoque: listagem + ajuste manual com `stock_movements`
- Notificações in-app: badge real + popover (novos pedidos, estoque baixo, pagamento falho)

---

## Fase 6 — Sincronização de Estoque ✅

- `ErpClientInterface` + `HttpErpClient` (cliente HTTP genérico, paginado, com cache)
- `StockService`: reserve, release, syncFromErp com movimentações
- `SyncInventoryJob` agendado diariamente às 03:00 via Horizon
- `php artisan inventory:sync`

---

## Fase 7 — Financeiro ✅

- `Transaction`, `FinancialService` (DRE, fluxo de caixa)
- `ExportReportJob` (CSV de pedidos ou DRE em background)
- Dashboard de relatórios: KPIs, receita por dia, top 10 produtos, DRE, exportação CSV

---

## Fase 8 — Marketing e Conteúdo ✅

- Blog: `Post` (SoftDeletes, readingTime), `PostCategory` + CRUD admin completo
- Newsletter: double opt-in, `NewsletterConfirmation` Mail, admin com exportação CSV
- Simulador fotovoltaico (irradiância 27 estados, payback, CO₂)
- Reviews e Q&A: moderação no admin com aprovação/rejeição/resposta oficial
- Cupons: CRUD + toggle ativo/inativo

---

## Fase 9 — SEO, Performance, Segurança ✅

- Horizon: 4 supervisors (default, emails, payments, sync)
- Telescope: protegido por role admin, mascaramento de dados sensíveis
- Sitemap.xml com cache de 1h
- Rate limiting: autocomplete (60/min), simulador (30/min)
- Banner de cookies LGPD (consentimento por localStorage)
- Páginas de erro 404/500/503 via Inertia (`Error.tsx`)

---

## Extras Implementados ✅

| Feature | Descrição |
|---------|-----------|
| 2FA Admin | TOTP com QR Code SVG, recovery codes, middleware `two-factor` |
| Notificações in-app | Database notifications, badge real, popover com mark-as-read |
| Webhook Asaas | Verificação de assinatura via header `asaas-access-token` |
| Cookie consent | Banner LGPD com "Apenas essenciais" / "Aceitar todos" |
| Produtos vistos recentemente | Hook `useTrackView` + componente `RecentlyViewed` via localStorage |
| Páginas institucionais | `/sobre`, `/contato` (com envio de e-mail), `/privacidade` (LGPD) |
| Newsletter no footer | Formulário nativo no rodapé da loja |
| Admin Newsletter | Listagem de inscritos com filtros e exportação CSV |
| Blog — Categorias admin | CRUD completo de categorias de post |
| ProductCard melhorado | Botão favorito + add-to-cart + hover effect |

---

## Próximos Passos para Produção

1. **Configurar credenciais reais:**
   ```env
   PAYMENT_GATEWAY=asaas
   ASAAS_API_KEY=sua_chave_real
   ASAAS_ENVIRONMENT=production
   ERP_BASE_URL=https://api.distribuidor.com.br
   ERP_API_KEY=sua_chave
   ERP_SYNC_ENABLED=true
   ```

2. **Adaptar `HttpErpClient::mapProduct()`** para o formato da API do distribuidor.

3. **Rodar em produção:**
   ```bash
   php artisan migrate --force
   php artisan db:seed --class=ProductionSeeder
   php artisan storage:link
   php artisan scout:import "App\Domains\Catalog\Models\Product"
   php artisan horizon
   ```

---

## Futuro (pós-MVP)

Marketplace · App mobile/PWA · CRM · Programa de instaladores · Cashback · IA/Chatbot · Central de projetos solares · Portais (distribuidores, representantes) · Split de pagamento · Frete com cotação real (Melhor Envio).

> Arquitetura por domínios + eventos + interfaces deixa esses itens viáveis sem reescrever o núcleo.

---

## Ordem de Implementação dentro de cada Feature

1. Migration + Model + Factory
2. DTO + Enum (se houver)
3. Repository (interface + Eloquent) + binding
4. Service/Action + Eventos/Listeners/Jobs
5. Form Request + Controller + Resource
6. Rotas + Policy/permissões
7. Página/Componentes React (Inertia + MUI)
8. Logs/Auditoria
9. Testes (unit + feature)
10. `composer check` + ajustes + doc
