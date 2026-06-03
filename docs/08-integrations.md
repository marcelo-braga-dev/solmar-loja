# 08 — Integrações

Todas as integrações externas vivem no domínio `Integrations`, atrás de **interfaces** (contratos), permitindo trocar fornecedores sem afetar o resto do sistema. Credenciais em `.env`/Settings, nunca hardcoded.

---

## 1. Sincronização de Estoque/Produtos (crítico)

A loja sincroniza diariamente com um **banco de dados de estoque remoto** (distribuidor/ERP).

### Princípios

- **Idempotente:** rodar duas vezes não duplica nem corrompe.
- **Auditável:** cada execução gera um `SyncLog` com início, fim, totais, erros e diffs.
- **Não destrutiva:** **nenhuma sincronização pode apagar dados sem auditoria**. Produtos ausentes na origem são marcados (ex.: `status = archived` ou `sync_status = missing`), nunca hard-deletados automaticamente.
- **Resiliente:** falha parcial não aborta tudo; registra e continua; reprocessável.
- **Em fila:** roda como Job agendado (Scheduler) na fila `sync`.

### Campos importados por produto

Preço · Estoque · Imagens · Descrição · Ficha técnica · Garantia · Peso · Dimensões · Categorias.

### Fluxo

```
Scheduler (diário)
  → DispatchInventorySyncJob
      → busca dados da fonte (API/arquivo) via IntegrationClient
      → para cada item:
          - faz match por external_id/SKU
          - calcula diff (antes/depois)
          - aplica via ProductService/StockService (Repository)
          - registra StockMovement (type=sync) e audit_log
          - dispara ProductSynced / StockChanged
      → grava SyncLog (resumo + erros)
      → reindexa Meilisearch dos alterados
```

### Regras de negócio na sincronização

- Mudança de preço acima de um limiar (%) pode exigir revisão/alerta (configurável).
- Estoque vai para `quantity_available`; reservas ativas são preservadas.
- Imagens novas baixadas para S3; remoção de imagem registrada, não destrutiva.
- Logs completos: usuário (sistema), timestamp, ação, antes, depois.

---

## 2. Pagamentos (Gateways)

Interface `PaymentGatewayInterface` com implementações por gateway (ex.: Mercado Pago, Pagar.me, Stripe, Asaas — escolher conforme negócio).

Métodos suportados:
- **Pix** (geração de QR/copia-e-cola, expiração, webhook de confirmação).
- **Boleto** (geração, vencimento, webhook).
- **Cartão de crédito** (transparente, tokenização, parcelamento, antifraude).
- **Split** de pagamento (futuro — marketplace).

Regras:
- **Webhooks idempotentes:** registre em `payment_webhooks`, processe uma vez.
- Confirmação de pagamento dispara `PaymentApproved` → libera pedido + baixa estoque.
- Nunca confie no front para status de pagamento — só no webhook/consulta ao gateway.
- Tokenização: dados de cartão nunca trafegam/armazenam no servidor (PCI — usar SDK do gateway no front).

---

## 3. Frete / Transportadoras

Interface `ShippingProviderInterface` (Correios, transportadoras, agregadores como Melhor Envio/Frenet).

- Cálculo por CEP + dimensões/peso do carrinho.
- Múltiplas opções (prazo x preço).
- Geração de etiqueta e código de rastreamento.
- Frete grátis por regra (valor mínimo, região, campanha).
- Cache de cotações de curta duração.

---

## 4. ERPs / Distribuidores

- Interface genérica `ErpClientInterface` por fornecedor.
- Usada pela sincronização (§1) e, no futuro, para envio de pedidos/NF.
- Mapeamento de categorias/atributos da origem → taxonomia interna (tabela de-para).

---

## 5. E-mail / Notificações

- E-mails transacionais (pedido, pagamento, envio) via Mail + fila `emails`.
- Provedor: SES/Mailgun/Resend (configurável).
- Templates versionados, em pt-BR.
- Notificações internas (admin) para eventos importantes (estoque zerado, erro de sync, pedido grande).

---

## 6. Busca (Meilisearch)

- Via Laravel Scout.
- Índices: produtos (principal), categorias, marcas, posts do blog.
- Reindexação por evento e comando agendado de consistência.

---

## 7. Storage (Local)

**Decisão arquitetural:** o armazenamento de arquivos utiliza o disco **local** do servidor (`storage/app/public`), sem dependência de serviços externos como Amazon S3. Os arquivos são servidos via symlink público (`php artisan storage:link`).

- Imagens de produto, downloads, etiquetas e exportações em `storage/app/public/`.
- Organização: `products/images/`, `products/downloads/`, `orders/labels/`, `exports/`.
- Disco configurado: `FILESYSTEM_DISK=local` + disco `public` para arquivos acessíveis na web.
- Para downloads privados (ex.: arquivos de garantia do cliente), servir via rota autenticada com `Storage::download()`.
- **Backup:** implementar rotina de backup do diretório `storage/app` para garantir redundância.

> Se no futuro a escala exigir storage externo, o Laravel Filesystem permite trocar o driver (S3, Cloudflare R2, etc.) sem alterar o código da aplicação — apenas configuração no `.env`.

---

## 8. Boas Práticas de Integração

- **Timeouts e retries** com backoff em toda chamada externa.
- **Circuit breaker** para fonte instável.
- **Rate limiting** respeitando limites do fornecedor.
- **Logs** de request/response (sem dados sensíveis).
- **Testes** com fakes/mocks dos clients (nunca bater em produção externa nos testes).
- Credenciais rotacionáveis via Settings/`.env`.
