# 09 — Segurança, Permissões e LGPD

Segurança é requisito de primeira classe. Toda feature considera autenticação, autorização, auditoria e proteção de dados.

---

## 1. Autenticação

- Laravel (sessão para o storefront/admin via Inertia).
- **2FA** (TOTP) disponível para clientes e **obrigatório** para administradores.
- Política de senha forte; hashing `bcrypt`/`argon2`.
- Verificação de e-mail no cadastro.
- Recuperação de senha segura (tokens expiráveis).
- Gestão de sessões ativas (cliente pode revogar).
- Throttling de login (rate limit) contra brute force.

---

## 2. Autorização (Papéis e Permissões)

Use `spatie/laravel-permission`.

Papéis sugeridos:
- `customer` — cliente final.
- `admin` — acesso total.
- `manager` — gestão geral sem configurações críticas.
- `finance` — financeiro e relatórios.
- `stock` — estoque e sincronização.
- `support` — suporte e pedidos (leitura/limitado).

Regras:
- Toda operação no admin protegida por **Policy** e/ou permissão nomeada (ex.: `products.update`, `orders.refund`).
- `Gate`/`authorize()` em controllers e em componentes (esconder UI não autorizada).
- Princípio do menor privilégio.

---

## 3. Proteções de Aplicação

| Ameaça | Mitigação |
|--------|-----------|
| CSRF | Token CSRF do Laravel em todas as requisições de escrita |
| XSS | Escapar saída; sanitizar HTML rico (descrições); CSP headers |
| SQL Injection | Eloquent/Query Builder com bindings — nunca concatenar SQL |
| Mass assignment | `$fillable` explícito |
| Brute force | Rate limiting (login, APIs, busca) |
| Clickjacking | `X-Frame-Options` / CSP `frame-ancestors` |
| Enumeração de IDs | UUID público em URLs/APIs |
| Upload malicioso | Validar mime/tamanho; escanear; servir de domínio separado/CDN |

Headers de segurança (HSTS, X-Content-Type-Options, Referrer-Policy, CSP) via middleware.

---

## 4. Dados Sensíveis e Criptografia

- Segredos em `.env`/secret manager.
- Criptografar em repouso dados sensíveis (ex.: documentos do cliente) com `Crypt`.
- **Cartão de crédito nunca** trafega/armazena no servidor — tokenização no gateway (PCI-DSS).
- TLS obrigatório (HTTPS) em produção.
- Mascarar dados sensíveis em logs.

---

## 5. LGPD (Lei Geral de Proteção de Dados)

- **Consentimento** explícito para marketing (newsletter com double opt-in).
- **Base legal** documentada para cada uso de dado.
- Direitos do titular: **acessar, exportar, corrigir e excluir/anonimizar** dados — implementar fluxos no admin e na área do cliente.
- **Anonimização** em vez de exclusão quando houver obrigação fiscal (pedidos).
- Política de privacidade e cookies; banner de consentimento de cookies (recusar não-essenciais por padrão).
- Retenção mínima de dados; expurgo programado do que não é necessário.
- Registro de tratamento e de incidentes.

---

## 6. Logs e Auditoria

Auditoria completa de ações sensíveis na tabela `audit_logs` (ver `docs/04`).

Registrar para cada ação relevante:
- **Usuário** (quem)
- **IP** e user-agent
- **Data/hora**
- **Ação** (ex.: `order.refunded`)
- **Antes** e **Depois** (diff do estado)

Aplicar via Observers nos models críticos (Product, Order, Payment, Stock, Settings, User) e em Actions sensíveis. Logs imutáveis (sem update/delete). Monitoramento com Telescope (dev) e logs estruturados (prod).

---

## 7. Filas, Jobs e Webhooks Seguros

- Webhooks validados por assinatura do provedor.
- Idempotência (tabela de eventos processados).
- Jobs com retry/backoff e tratamento de falha (`failed_jobs`).
- Horizon protegido por auth (apenas admin).

---

## 8. Checklist de Segurança por Feature

- [ ] Entrada validada (Form Request).
- [ ] Autorização (Policy/permissão) aplicada.
- [ ] Saída escapada/serializada (Resource/DTO).
- [ ] Ação sensível auditada.
- [ ] Sem dado sensível em log/URL.
- [ ] Rate limit onde aplicável.
- [ ] Teste cobrindo caso não autorizado (403).
