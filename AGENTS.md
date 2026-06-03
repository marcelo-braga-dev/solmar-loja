# CLAUDE.md — SolarHub Commerce

> **Este é o arquivo-mestre de instruções para agentes de IA (Claude Code, Codex).**
> Leia este arquivo por completo antes de escrever qualquer linha de código.
> Ele define como o projeto deve ser construído, mantido e evoluído.

---

## 0. TL;DR para o Agente

Você está construindo o **SolarHub Commerce**, uma plataforma de e-commerce robusta e moderna para o segmento fotovoltaico/energia solar no Brasil.

**Stack:** Laravel 12 · Inertia 2 · React 18 · Material UI 6 · MySQL 8 · Redis · Meilisearch.

**Regras inegociáveis:**

1. **Nunca** escreva regra de negócio em Controllers. Controllers apenas orquestram.
2. **Toda** persistência passa por um Repository.
3. **Toda** regra de negócio vive em um Service ou Action.
4. **Todo** dado que cruza camadas é um DTO tipado.
5. **Toda** feature tem: Repository + Service + DTO + Validação + Testes + Logs + Permissões.
6. Escreva testes (Pest) para tudo. Cobertura mínima **80%**.
7. Código, nomes de variáveis e comentários técnicos em **inglês**. Conteúdo de UI em **português (pt-BR)**.
8. Antes de criar um arquivo novo, verifique se já existe um padrão equivalente no projeto e siga-o.

Quando estiver em dúvida sobre uma decisão arquitetural, **consulte os arquivos em `/docs`** listados na seção 2.

---

## 1. Identidade do Projeto

| Item | Valor |
|------|-------|
| Nome | SolarHub Commerce |
| Tipo | E-commerce B2C (com base para B2B futuro) |
| Segmento | Energia solar, fotovoltaico, mobilidade elétrica, produtos elétricos |
| Mercado | Brasil (pt-BR, BRL, fuso America/Sao_Paulo) |
| Objetivo | Tornar-se uma das maiores plataformas de venda online do segmento fotovoltaico no Brasil |

**Atributos que a plataforma deve transmitir:** confiança, modernidade, tecnologia, segurança, alta performance e escalabilidade.

---

## 2. Mapa da Documentação

Leia os documentos na ordem indicada conforme a tarefa:

| Arquivo | Quando ler |
|---------|-----------|
| `CLAUDE.md` (este) | Sempre, primeiro |
| `docs/01-architecture.md` | Antes de criar qualquer módulo |
| `docs/02-conventions.md` | Antes de escrever código |
| `docs/03-domain-model.md` | Ao modelar entidades e banco |
| `docs/04-database.md` | Ao criar migrations |
| `docs/05-frontend.md` | Ao trabalhar com React/Inertia/MUI |
| `docs/06-features-storefront.md` | Ao implementar páginas da loja |
| `docs/07-features-admin.md` | Ao implementar o painel admin |
| `docs/08-integrations.md` | Ao trabalhar com estoque/pagamentos/frete |
| `docs/09-security.md` | Ao lidar com auth, dados sensíveis, LGPD |
| `docs/10-testing.md` | Ao escrever testes |
| `docs/11-roadmap.md` | Para entender o faseamento e o que é futuro |

---

## 3. Princípios Arquiteturais (resumo)

O projeto segue **Clean Architecture** adaptada ao Laravel, com **Domain-Driven Design** leve. Detalhes em `docs/01-architecture.md`.

Fluxo de uma requisição:

```
Request → Controller → (Action | Service) → Repository → Model → DB
                          ↓
                        DTO ↔ Resource → Inertia/JSON → React
```

- **Controllers**: finos. Recebem Request, chamam um Service/Action, retornam resposta.
- **Form Requests**: toda validação de entrada.
- **DTOs**: objetos imutáveis tipados para transporte de dados entre camadas.
- **Services**: regra de negócio de um domínio.
- **Actions**: uma única operação de negócio complexa (ex.: `PlaceOrderAction`).
- **Repositories**: única porta de acesso ao banco. Models nunca são consultados direto fora deles.
- **Events/Listeners**: efeitos colaterais desacoplados (e-mail, sincronização, logs).
- **Jobs/Queues**: tudo que não precisa ser instantâneo.

---

## 4. Workflow do Agente (como trabalhar neste repo)

1. **Entenda a tarefa** e identifique o domínio afetado (`app/Domains/<Domain>`).
2. **Leia** os docs relevantes da seção 2.
3. **Planeje** a mudança: liste arquivos a criar/editar (migration, model, repo, service, DTO, controller, request, página React, teste).
4. **Implemente** seguindo a "Regra de Ouro" (seção 6).
5. **Escreva testes** antes ou junto da implementação.
6. **Rode a verificação**: `composer check` (ver seção 5).
7. **Atualize a documentação** se introduziu um novo padrão ou módulo.

> Nunca entregue uma feature sem testes e sem passar no `composer check`.

---

## 5. Comandos Essenciais

Estes comandos devem existir no projeto. Crie-os caso ainda não existam.

```bash
# Setup inicial
composer install && npm install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
npm run dev

# Qualidade (rode antes de considerar a tarefa concluída)
composer check        # roda pint + phpstan + pest em sequência
./vendor/bin/pint              # formatação (Laravel Pint)
./vendor/bin/phpstan analyse   # análise estática (nível 6+)
./vendor/bin/pest              # testes
./vendor/bin/pest --coverage --min=80

# Filas e busca
php artisan horizon            # worker de filas (Redis)
php artisan scout:import       # indexar no Meilisearch

# Front
npm run dev / npm run build
```

Defina o script `check` no `composer.json`:

```json
"scripts": {
  "check": [
    "./vendor/bin/pint --test",
    "./vendor/bin/phpstan analyse --memory-limit=2G",
    "./vendor/bin/pest"
  ]
}
```

---

## 6. A Regra de Ouro

> **Nenhuma funcionalidade pode ser criada sem:**
> Repository · Service (ou Action) · DTO · Validação · Testes · Logs · Permissões · Documentação.

Se algum desses oito itens não fizer sentido para uma feature trivial, **documente o porquê** no PR/commit. O default é cumprir todos.

---

## 7. O que NUNCA fazer

- ❌ Query Eloquent dentro de Controller, Blade/JSX ou Service sem passar pelo Repository.
- ❌ Regra de negócio em Controller, Model ou componente React.
- ❌ Retornar Models direto para o front — use Resources/DTOs.
- ❌ `dd()`, `dump()`, `var_dump()` ou `console.log` em código entregue.
- ❌ Segredos hardcoded — tudo em `.env`.
- ❌ Apagar dados em sincronização sem auditoria (ver `docs/08-integrations.md`).
- ❌ Commit sem testes passando.
- ❌ Bullets ou texto em inglês na UI voltada ao cliente.

---

## 8. Definição de Pronto (Definition of Done)

Uma tarefa está pronta quando:

- [ ] Código segue as convenções de `docs/02-conventions.md`.
- [ ] Repository + Service/Action + DTO + Form Request implementados.
- [ ] Eventos/Jobs disparados quando aplicável.
- [ ] Permissões/Policies aplicadas.
- [ ] Logs de auditoria registrados para ações sensíveis.
- [ ] Testes (unit + feature) escritos e passando, cobertura ≥ 80%.
- [ ] `composer check` passa sem erros.
- [ ] UI responsiva e acessível (ver `docs/05-frontend.md`).
- [ ] Documentação atualizada se necessário.
