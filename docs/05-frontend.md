# 05 — Frontend (React + Inertia + Material UI)

## 1. Stack e Decisões

- **Inertia 2** como ponte Laravel↔React (sem API REST separada para o front próprio).
- **React 18** com **TypeScript** (obrigatório — sem JS puro).
- **Material UI 6 (MUI)** como design system base, customizado via tema.
- **Vite** como bundler.
- Gerenciamento de estado local: hooks do React + Context para carrinho/usuário. Evite Redux salvo necessidade real.
- Formulários: `useForm` do Inertia (validação vinda do Laravel).
- Requisições assíncronas pontuais (busca, autocomplete): axios + endpoints JSON dedicados.

> Conteúdo de UI sempre em **pt-BR**.

---

## 2. Organização

```
resources/js/
├── app.tsx                 # bootstrap Inertia
├── Pages/
│   ├── Storefront/         # Home, Category, Product, Cart, Checkout, Account/*
│   └── Admin/              # Dashboard, Products, Orders, Customers, Financial...
├── Layouts/
│   ├── StorefrontLayout.tsx
│   └── AdminLayout.tsx
├── Components/
│   ├── storefront/         # ProductCard, FilterSidebar, CartDrawer...
│   ├── admin/              # DataTable, StatCard, FormSection...
│   └── ui/                 # wrappers genéricos sobre MUI
├── Hooks/
├── Theme/                  # theme.ts (paleta, tipografia, overrides)
├── Lib/                    # axios, formatters (money, date), helpers
└── Types/                  # tipos TS compartilhados (props Inertia)
```

---

## 3. Tema e Identidade Visual

A marca deve transmitir **tecnologia, confiança e energia**. Sugestão de direção (ajustável):

- **Primária:** azul tecnológico/energia (ex.: `#0B5FFF` ou `#1565C0`).
- **Secundária/acento:** verde solar ou amarelo energia (ex.: `#FFB300` / `#16A34A`).
- **Neutros:** cinzas frios para fundos e texto.
- **Tipografia:** sans moderna e legível (Inter, Manrope ou Plus Jakarta Sans).
- **Raio de borda:** suave (8–12px). **Sombras:** sutis. Visual limpo, espaçado, "respirável".
- **Modo escuro:** suportar via tema MUI (especialmente útil no admin).

Defina tudo em `Theme/theme.ts` com `createTheme`, incluindo overrides de componentes (botões, cards, inputs) para um visual próprio — evite o "cara de MUI padrão".

```ts
export const theme = createTheme({
  palette: {
    primary: { main: '#0B5FFF' },
    secondary: { main: '#FFB300' },
    // ...
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: '"Inter", sans-serif' },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  },
});
```

---

## 4. Padrões de Componentes

- Componentes pequenos, tipados, com props explícitas (sem `any`).
- Um componente por arquivo. Nome do arquivo = nome do componente.
- Lógica reutilizável em hooks (`useCart`, `useDebounce`, `useFilters`).
- Skeletons/loaders para estados de carregamento.
- Imagens com `loading="lazy"`, `srcset`/tamanhos responsivos e dimensões definidas (evita CLS).
- Acessibilidade: labels em inputs, `alt` em imagens, navegação por teclado, contraste AA.

---

## 5. Layouts

- **StorefrontLayout:** header com busca + menu de categorias (mega menu), mini-carrinho, área do cliente; footer completo (institucional, categorias, atendimento, redes, selos de segurança, formas de pagamento).
- **AdminLayout:** sidebar colapsável com navegação por seções, topbar com busca global, notificações e perfil; breadcrumbs.

Persista o layout entre navegações Inertia (`Page.layout = ...`) para não remontar.

---

## 6. Performance no Front (ver metas em docs/09 e roadmap)

- **Code splitting** por página (Inertia + Vite fazem por padrão; garanta lazy nos componentes pesados).
- **Virtualização** de listas longas (`@tanstack/react-virtual` ou `react-window`) em catálogos e tabelas admin grandes.
- **Lazy load** de imagens e de seções abaixo da dobra.
- Memoização (`useMemo`, `React.memo`) onde houver render caro.
- Evite re-render global do carrinho — isole no Context com seletor.
- Prefetch de links Inertia em hover para navegação instantânea.

Metas de Web Vitals: **LCP < 2s, CLS < 0.1, TTFB < 500ms**.

---

## 7. Formatação e Localização

- Moeda: helper `formatBRL(cents)` → `R$ 1.234,56`.
- Datas: `pt-BR`, fuso `America/Sao_Paulo`.
- Números/medidas com unidades do segmento (W, kWp, V, Ah).

---

## 8. Integração com Inertia

- Props de página vêm tipadas de `Types/`.
- Dados compartilhados globais (usuário, carrinho count, flash messages) via `HandleInertiaRequests` middleware → `usePage().props`.
- Erros de validação do Laravel aparecem em `errors` do `useForm`.
- Flash de sucesso/erro exibido via Snackbar global no layout.

---

## 9. Componentes-Chave a Construir

**Storefront:** Header/MegaMenu, SmartSearch (autocomplete Meilisearch), ProductCard, ProductGallery (zoom + vídeo), FilterSidebar, SortSelect, Pagination, CartDrawer, CheckoutStepper, AddressForm, PaymentSelector, ReviewList, QnAList, SolarSimulator (simulador fotovoltaico), Newsletter, Footer.

**Admin:** DataTable (ordenável, filtrável, paginada, com ações em massa), StatCard, ChartCard (recharts), FormBuilder/FormSection, MediaUploader (S3), StatusBadge, DateRangePicker, ExportButton.
