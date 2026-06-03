# 07 — Painel Administrativo

Painel completo para gerir a loja. Acesso: `auth + admin + two-factor` middleware. Todas as ações sensíveis são auditadas.

> **Status:** Todas as features abaixo estão implementadas. Este documento serve como referência do que existe e onde está.

---

## Acesso e Segurança ✅

- URL: `/admin`
- Middleware: `['auth', 'admin', 'two-factor']`
- 2FA TOTP obrigatório quando habilitado (`/two-factor/setup`)
- Roles com acesso: `admin`, `manager`

---

## 1. Dashboard ✅

- KPIs: receita mensal (com comparativo mês anterior), pedidos do mês/dia, total de produtos e clientes
- Pedidos por status (gráfico de barras)
- Últimos 5 pedidos com status colorido
- Notificações in-app: badge real + popover com mark-as-read

**Arquivo:** `Pages/Admin/Dashboard.tsx` | `Controllers/Admin/DashboardController.php`

---

## 2. Catálogo ✅

| Rota | Função |
|------|--------|
| `/admin/products` | Listagem com busca e filtro de status |
| `/admin/products/create` | Formulário de criação |
| `/admin/products/{uuid}/edit` | Edição (preço, estoque, specs, SEO) |
| `/admin/products/{uuid}/publish` | Publicar / despublicar |
| `/admin/products/{product}/images` | Upload, reordenação, exclusão de imagens |
| `/admin/categories` | CRUD de categorias em árvore |
| `/admin/brands` | CRUD de marcas |

---

## 3. Pedidos ✅

| Rota | Função |
|------|--------|
| `/admin/orders` | Listagem com filtros por status |
| `/admin/orders/{uuid}` | Detalhe: itens, pagamentos, envio, notas |
| `PATCH /admin/orders/{uuid}/status` | Troca de status com máquina de estados |
| `POST /admin/orders/{uuid}/shipment` | Registrar expedição + código de rastreamento |

**Arquivo:** `Pages/Admin/Orders/` | `Controllers/Admin/OrderAdminController.php`

---

## 4. Clientes ✅

| Rota | Função |
|------|--------|
| `/admin/customers` | Listagem com busca |
| `/admin/customers/{user}` | Perfil 360°: pedidos, endereços, total gasto |

---

## 5. Estoque ✅

| Rota | Função |
|------|--------|
| `/admin/inventory` | Saldo por produto com estoque disponível/reservado |
| `POST /admin/inventory/adjust` | Ajuste manual auditado com motivo |

Alertas de estoque baixo (< 5 un.) disparam `LowStockNotification` para admins.

---

## 6. Financeiro / Relatórios ✅

| Rota | Função |
|------|--------|
| `/admin/reports` | KPIs + gráfico receita/dia + top 10 produtos |
| `/admin/reports` (tab DRE) | Demonstrativo de Resultado do Exercício |
| `/admin/reports` (tab CSV) | Exportação assíncrona via `ExportReportJob` |
| `GET /admin/reports/dre` | JSON da DRE por período |
| `POST /admin/reports/export` | Despacha `ExportReportJob` |
| `GET /admin/reports/download` | Download do CSV gerado |

**Arquivo:** `Pages/Admin/Reports/Index.tsx` (3 tabs) | `Jobs/ExportReportJob.php`

---

## 7. Marketing ✅

| Rota | Função |
|------|--------|
| `/admin/coupons` | CRUD de cupons (%, fixo, frete grátis) com toggle ativo |
| `/admin/posts` | CRUD de posts do blog |
| `/admin/post-categories` | CRUD de categorias do blog |
| `/admin/reviews` | Moderação de avaliações (aprovar/rejeitar) + responder perguntas |
| `/admin/newsletter` | Lista de inscritos com filtros + exportação CSV |

---

## 8. Configurações ✅

| Rota | Função |
|------|--------|
| `/admin/settings` | 16 configurações em 4 grupos (geral, contato, pagamento, frete) |
| `/two-factor/setup` | Configuração do 2FA TOTP (QR Code SVG + recovery codes) |

---

## 9. Notificações In-App ✅

- Badge no header com contagem de não lidas
- Popover com últimas 20 notificações e "Marcar todas como lidas"
- Tipos disparados automaticamente:
  - `NewOrderNotification` → evento `OrderPlaced`
  - `LowStockNotification` → evento `StockChanged` (quando < 5 un.)
  - `PaymentFailedNotification` → evento `PaymentFailed`

**Arquivo:** `app/Notifications/` | `app/Listeners/` | `Controllers/Admin/NotificationController.php`

---

## 10. Padrões de Implementação

- Listagens com paginação server-side via Repository
- Form Request + Service/Action + evento + log em cada escrita
- Confirmação dialog para ações destrutivas
- Flash messages via `session()->with('success'/'error')`
- Soft delete em Products e Posts
- Exports via Jobs em background (fila `default`)
