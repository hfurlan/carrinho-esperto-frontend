# Consumer visual language — "cupom & caderno" (M006.2)

The consumer app (landing, auth, dashboard, purchases, receipt, import) shares
one visual language. The **admin app keeps its own dense slate chrome** and does
not use any of this — that separation is deliberate (M006.2 §6).

## Tokens — `frontend/src/index.css` `@theme`

| Token | Value | Role |
|---|---|---|
| `--color-paper` | `#FBF9F4` | page ground (warm paper) |
| `--color-card` | `#FFFFFF` | the few real panels |
| `--color-ink` | `#211E1B` | text and headline numbers |
| `--color-muted` | `#7A7267` | secondary text |
| `--color-line` | `#E7E0D2` | hairline rules / borders |
| `--color-accent` | `#2E7D4F` | actions, links, "básico" |
| `--color-warn` | `#9C6F1E` | seal "Atenção" |
| `--color-rose` | `#B64F58` | seal "Muitos supérfluos", "doces" |

Display face **Bricolage Grotesque** (Google Fonts, linked in `index.html`) via
`--font-display` / the `font-display` utility — used for headings, the big
figures, seals and money. Body is the system sans.

## Principles

- **No fiscal-dashboard tells.** No ALL-CAPS eyebrow labels; no `A · B · C` meta
  strings; hairline rows (`border-b border-line`) instead of a card around
  everything. Cards (`<Card>`) are reserved for a genuine panel (Basket Insight,
  the conversion CTA).
- **One bold element per screen.** Dashboard: the month figure (`<Figure>`).
  Receipt: the seal (`<Seal>`). Everything else stays quiet.
- **`tabular-nums`** on every column of money / quantities.
- **Warm, human pt-BR.** "Sua primeira compra começa aqui", "O que tem na sua
  compra?", "Guardar esta compra?", "Deu um problema aqui". Technical terms stay
  in the admin views.
- **Mobile-first.** Bottom tab bar (Início / Compras / Importar) on small
  screens; `env(safe-area-inset-bottom)` respected; auth and import laid out for
  a phone first.

## Shared components — `frontend/src/components/ui.tsx`

`Button` (primary / secondary / ghost / danger) · `Card` (hairline, low radius,
no shadow) · `TextInput` · `Field` (label + control + hint/error) · `PageHeader`
(no uppercase) · `Figure` (big ink number + plain label) · `Seal` (the basket
stamp — `good` / `watch` / `bad` / `none`) · `Badge`.

`AuthShell` wraps `/login` and `/cadastro`. `StateViews` (loading / empty /
error) and `BasketInsight` follow the same tokens.
