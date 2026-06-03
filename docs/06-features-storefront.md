# 06 — Features do Storefront (Loja)

Objetivo macro: **converter visitantes em compradores** com uma experiência rápida, confiável e fácil.

> **Status:** Todas as features abaixo estão implementadas. Este documento serve como referência do que existe e onde está.

---

## 1. Home Page ✅

Seções implementadas (em ordem):

1. **Hero principal** — banner com CTA e destaques
2. **Busca inteligente** — `SmartSearch.tsx` com autocomplete Meilisearch (debounce 300ms)
3. **Categorias principais** — cards visuais
4. **Ofertas** — produtos com `compare_at_price` e badge de desconto
5. **Produtos em destaque** — curadoria
6. **Marcas parceiras** — logos
7. **Benefícios** — frete, parcelamento, garantia, suporte
8. **Newsletter** — `CookieBanner` + strip no footer
9. **Rodapé completo** — `StorefrontLayout.tsx` footer com links institucionais

**Componentes:** `Pages/Storefront/Home.tsx` | `Components/storefront/ProductCard.tsx`

---

## 2. Navegação ✅

- Header fixo com `SmartSearch`, carrinho (badge), menu do usuário
- Barra de navegação com: Energia Solar, Kits, Painéis, Inversores, Baterias, Mobilidade, **Simulador Solar**, **Blog**
- Drawer mobile com os mesmos links
- Flash messages para todos os tipos (success, error, warning, info)

---

## 3. Listagem por Categoria ✅

- Filtros: marca, faixa de preço, promoção
- Ordenação: menor preço, maior preço, mais recentes, nome
- Chips de filtros ativos, contagem de resultados
- Paginação com `Pagination.tsx`

**Arquivo:** `Pages/Storefront/Category.tsx`

---

## 4. Página de Produto ✅

- Galeria de imagens com thumbnail selecionável
- Preço, parcelamento (12x sem juros), preço "de/por"
- Botões: favoritar (toggle AJAX), adicionar ao carrinho, compartilhar
- Abas: Descrição | Especificações | Downloads | Avaliações
- Avaliações com `ReviewSection.tsx` (rating, formulário, listagem async)
- Produtos relacionados
- **Vistos recentemente** — `RecentlyViewed.tsx` via localStorage
- Tracking de visita com `useTrackView` hook

**Arquivo:** `Pages/Storefront/Product.tsx`

---

## 5. Carrinho ✅

- Página dedicada `/carrinho`
- Controle de quantidade, remoção de item, aplicação de cupom
- Persistência: visitante (session_id) e logado (user_id), com merge automático ao logar
- **Segurança:** IDOR fix — `CartController` verifica ownership antes de update/destroy

**Arquivo:** `Pages/Storefront/Cart.tsx` | `Controllers/Storefront/CartController.php`

---

## 6. Checkout ✅

- Seleção de endereço salvo ou novo (busca CEP via ViaCEP)
- Seleção de método de pagamento (Pix, Boleto, Cartão)
- Criação de pedido em `DB::transaction()`, evento `OrderPlaced` disparado

**Arquivo:** `Pages/Storefront/Checkout.tsx` | `Controllers/Storefront/CheckoutController.php`

---

## 7. Pagamento ✅

- Página de confirmação com QR Code Pix / código de barras boleto
- Gateway ativo: `MockGateway` (dev) ou `AsaasGateway` (prod — `PAYMENT_GATEWAY=asaas`)
- Webhook com verificação de assinatura Asaas (`asaas-access-token`)

**Arquivo:** `Pages/Storefront/Payment.tsx` | `Controllers/Storefront/WebhookController.php`

---

## 8. Área do Cliente ✅

| Rota | Página | Descrição |
|------|--------|-----------|
| `/conta` | `Account/Dashboard.tsx` | KPIs, alerta verificação e-mail |
| `/conta/pedidos` | `Account/Orders.tsx` | Histórico paginado |
| `/conta/pedidos/{uuid}` | `Account/OrderDetail.tsx` | Detalhe com rastreamento e pagamentos |
| `/conta/perfil` | `Account/Profile.tsx` | Dados pessoais + alterar senha |
| `/conta/enderecos` | `Account/Addresses.tsx` | CRUD com busca CEP |
| `/conta/favoritos` | `Account/Favorites.tsx` | Grid de favoritos |

---

## 9. Simulador Fotovoltaico ✅

- Wizard 3 etapas: consumo → localização → resultado
- `SolarSimulatorService` com irradiância real dos 27 estados
- Cálculo: kWp, número de painéis, economia, CO₂ evitado, payback simples
- Sugestão de kit do catálogo

**Arquivo:** `Pages/Storefront/Simulator.tsx` | `Services/SolarSimulatorService.php`

---

## 10. Busca ✅

- `/busca` — resultados paginados com filtros
- `/api/search/autocomplete` — JSON para `SmartSearch` (rate limit: 60/min)
- Meilisearch via Scout no model `Product`

---

## 11. Blog ✅

- `/blog` — listagem com filtro por categoria e busca
- `/blog/{slug}` — post completo com posts relacionados e reading time
- Admin: CRUD de posts (`/admin/posts/*`) + categorias (`/admin/post-categories`)

---

## 12. Newsletter ✅

- `POST /newsletter/subscribe` — double opt-in com `NewsletterConfirmation` Mail
- `GET /newsletter/confirmar/{token}` — confirma inscrição
- `GET /newsletter/cancelar/{token}` — cancela inscrição
- Strip de newsletter no rodapé da StorefrontLayout

---

## 13. Páginas Institucionais ✅

| Rota | Página |
|------|--------|
| `/sobre` | `Storefront/Sobre.tsx` — história, números, valores |
| `/contato` | `Storefront/Contato.tsx` — formulário + canais |
| `/privacidade` | `Storefront/Privacidade.tsx` — política LGPD |

---

## 14. LGPD / Cookies ✅

- `CookieBanner.tsx` — slide-in com "Apenas essenciais" / "Aceitar todos"
- Preferência salva em `localStorage` (chave `solarhub_cookie_consent`)
- Link para `/privacidade`
