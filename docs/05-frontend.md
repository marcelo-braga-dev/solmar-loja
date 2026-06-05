# 05 — Frontend (React + Inertia + Material UI)

---

## 1. Stack e Decisões

| Tecnologia | Versão | Decisão |
|---|---|---|
| React | 18 | Hooks only, sem class components |
| TypeScript | 5.9 | Obrigatório — sem JS puro |
| Inertia.js | 2.3 | Bridge Laravel↔React sem API REST separada |
| Material UI | **9.0.1** | Props em `sx`, não styled-components |
| Vite | 8.0.16 (rolldown) | Node 22 via nvm |
| Recharts | latest | Gráficos no dashboard admin |

- **Estado local:** hooks do React (`useState`, `useReducer`, `useContext`)
- **Estado global:** localStorage para comparação e recently viewed
- **Formulários:** `useForm` do Inertia (validação via Laravel FormRequest)
- **Navegação:** `router` do Inertia (`router.get`, `router.post`, `router.delete`, `router.patch`)

---

## 2. MUI 9 — Regras Obrigatórias

### Usar `sx` prop para estilos — NUNCA como prop direta

```tsx
// ✅ Correto
<Box sx={{ fontWeight: 700, textAlign: 'center', mt: 2 }}>

// ❌ Errado (MUI 9 não aceita)
<Box fontWeight={700} textAlign="center" mt={2}>
```

### `ElementType` de 'react', NÃO de '@mui/material'

```tsx
// ✅ Correto
import { type ElementType } from 'react';
<Button component={Link as ElementType} href="...">

// ❌ Errado
import { ElementType } from '@mui/material';
```

### Slots/Props aninhados com `slotProps`

```tsx
// MUI 9 — slotProps
<TextField
    slotProps={{ input: { startAdornment: <InputAdornment>R$</InputAdornment> } }}
/>

// Não usar inputProps diretamente para propriedades de estilo
```

### Grid v2 (`size` prop)

```tsx
import { Grid } from '@mui/material';

// Usar size=, não xs= sm= md=
<Grid container spacing={3}>
    <Grid size={{ xs: 12, md: 6 }}>...</Grid>
    <Grid size={{ xs: 12, md: 6 }}>...</Grid>
</Grid>
```

---

## 3. Tipos TypeScript Compartilhados

### `resources/js/Types/inertia.d.ts`

```typescript
interface Branding {
    store_name: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    dark_bg_color: string;
    store_email: string;
    store_phone: string;
    social_whatsapp: string;
    social_instagram: string;
    // ... (todas as settings de identidade visual)
    free_shipping_min_cents: number;   // ← dinâmico via SettingsService
    free_shipping_enabled: boolean;    // ← dinâmico via SettingsService
}

interface SharedProps {
    auth: Auth;
    flash: Flash;
    cartCount: number;
    notifyCount: number;
    branding: Branding;
    [key: string]: unknown;
}
```

### Acessar shared props em qualquer componente

```tsx
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/Types/inertia';

const { auth, branding, cartCount } = usePage<SharedProps>().props;
```

---

## 4. Convenções de Componentes

### Nomenclatura de arquivos

```
Pages/Admin/Dashboard.tsx        — páginas admin
Pages/Storefront/Home.tsx        — páginas storefront
Pages/Storefront/Account/        — área do cliente
Components/storefront/           — componentes reutilizáveis storefront
Components/storefront/ProductGallery.tsx  — componente complexo próprio
Layouts/AdminLayout.tsx          — layout do painel
Layouts/StorefrontLayout.tsx     — layout da loja
Hooks/useComparison.ts           — hooks customizados
Lib/formatters.ts                — utilitários
Types/catalog.ts                 — tipos do catálogo
```

### Preços: sempre centavos no backend, reais no display

```tsx
// Exibição
{formatBRL(product.price_cents)}         // "R$ 1.999,00"
{formatInstallment(product.price_cents)} // "12x de R$ 166,58"

// Input de preço no admin (conversão bidirecional)
value={data.price_cents ? (data.price_cents / 100).toFixed(2) : ''}
onChange={(e) => setData('price_cents', Math.round(Number(e.target.value) * 100))}
slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
inputProps={{ step: '0.01', min: '0' }}
```

### Pagination — prop correta

```tsx
// ✅ Sempre usar 'pagination'
<Pagination pagination={products} />

// ❌ 'data' causa crash (TypeError: Cannot read 'last_page' of undefined)
<Pagination data={products} />
```

O componente `Pagination.tsx` tem guard defensivo:
```tsx
if (!pagination || pagination.last_page <= 1) return null;
```

---

## 5. Componentes Storefront — Referência

### `ProductGallery.tsx`

O componente mais complexo da loja. **Não editar sem ler a documentação.**

**Props:**
```typescript
interface Props {
    images: GalleryImage[];  // { url, alt?, is_cover? }
    productName: string;
    hasDiscount?: boolean;
    discountPercent?: number;
}
```

**Comportamento por breakpoint:**
- `xs/sm/md/lg`: thumbnails horizontais abaixo, click abre lightbox
- `xl+`: thumbnails verticais à esquerda + painel de zoom externo 500×500px ao hover

**Zoom externo:**
- Amplificação 3×
- Posicionado com `left: calc(100% + 20px)` — fora do container
- Só em `xl+` (telas ≥1536px) para ter espaço
- Sem cursor circular (removido por solicitação)

**Imagem principal:**
- `object-fit: cover` sem padding — preenche toda a área
- Crossfade 130ms ao trocar imagem
- `position: sticky; top: 88px` no Grid container

### `ComparisonBar.tsx`

```typescript
// Hook: resources/js/Hooks/useComparison.ts
const { items, toggle, isInComparison, canAdd, count } = useComparison();
```

- Persiste em localStorage com key `solarhub_compare`
- Máximo 4 produtos
- Integrado no `StorefrontLayout` (sempre visível)
- Botão "Comparar" no `ProductCard` usa `toggle()`

### `FlashSaleBanner.tsx`

```typescript
// Busca assíncrona ao montar
fetch(`/api/flash-sale/${productId}`)
  .then(d => { setData(d); setRemaining(d.remaining_s); })
```
- Countdown por segundo via `setInterval`
- Pisca quando `remaining < 300` (últimos 5 minutos)
- Barra de progresso de unidades quando `max_quantity` definido

### `ShippingCalculator.tsx`

- Input CEP com mask automático `XXXXX-XXX`
- Valida via ViaCEP (API pública)
- Calcula PAC e SEDEX por faixa regional (0-99 de CEP → regiões)
- Mostra "GRÁTIS" quando produto ≥ `freeShippingMin`

### `SocialProof.tsx`

- "X pessoas vendo agora" — número baseado em `id % 21 + 3`, flutua ±1 a cada 15s
- "X vendidos nos últimos 30 dias" — baseado em `id % 85 + 15`
- Urgência de estoque — só aparece quando `stockQuantity ≤ 8`

---

## 6. Layouts

### `StorefrontLayout.tsx`

Compartilha via `usePage<SharedProps>()`:
- `auth.user` — usuário logado (null se guest)
- `branding` — configurações visuais e frete grátis
- `cartCount` — número de itens no carrinho
- `flash` — mensagens de sucesso/erro

Componentes sempre presentes:
- `AnnouncementBar` — barra rotativa (fechável)
- `WhatsAppButton` — flutuante canto inferior direito
- `ComparisonBar` — barra sticky quando há produtos na comparação
- `CookieBanner` — LGPD

### `AdminLayout.tsx`

Compartilha:
- `auth.user` — dados do admin
- `notifyCount` — notificações não lidas (badge)

Sidebar com 8 seções, notificações com popover, card do usuário no rodapé.

---

## 7. Hooks Customizados

### `useComparison.ts`

```typescript
const { items, add, remove, toggle, clear, isInComparison, canAdd, count } = useComparison();
// localStorage key: 'solarhub_compare'
// Máximo: 4 produtos
```

### `useRecentlyViewed.ts`

```typescript
const { items, addProduct } = useRecentlyViewed();
const { useTrackView } = // chama addProduct ao montar a página do produto
// localStorage key: 'solarhub_recently_viewed'
// Máximo: 8 produtos
```

### `useSearch.ts`

```typescript
const { results, loading, search } = useSearch();
// Debounce 300ms, mínimo 2 caracteres
```

---

## 8. Formatação e Utilitários

**`resources/js/Lib/formatters.ts`:**

```typescript
formatBRL(cents: number): string
// 19990 → "R$ 199,90"

formatInstallment(cents: number, installments = 12): string
// 19990 → "12x de R$ 16,66"
```

---

## 9. Variáveis de Ambiente Frontend

Nenhuma — o frontend recebe tudo via Inertia shared props. As configurações dinâmicas (`frete_gratis`, `store_name`, etc.) vêm do `HandleInertiaRequests::share()`.

---

## 10. Regras de Performance

- Imagens: `loading="lazy"` em todos os `<img>` exceto above-the-fold
- `objectFit: 'cover'` sem padding para imagens de produto (nunca `contain` com padding)
- `useCallback` e `useMemo` para funções e dados computados pesados
- Evitar re-renders desnecessários: componentes de galeria e comparação usam `useCallback`
- Animações: `transition: 'all 0.15s'` como padrão, `cubic-bezier(0.34,1.56,0.64,1)` para spring
