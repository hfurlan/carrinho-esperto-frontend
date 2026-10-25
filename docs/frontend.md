# Frontend & Admin (M006)

> M006 turns the backend (M001–M005) into a manually testable product: a
> polished Brazilian-Portuguese consumer app for importing NFC-e receipts and
> seeing spending, plus a separate admin area for inspecting system state. It
> adds only the read/aggregation API endpoints the screens need — **no new
> bounded context, no new resolution logic** (M006 §21).

> **M006.1 update.** The consumer app no longer requires a login. A visitor
> lands on a public `LandingPage` and can start an **anonymous trial** to run
> the full import → receipt → insight flow (`docs/anonymous-trial.md`); the
> import screen leads with **camera / photo QR capture** and keeps manual URL as
> a fallback; every receipt (and the dashboard's latest one) shows **basket
> insight** — categories + a health selo (`docs/basket-insight.md`). Auth is now
> the mechanism for persistence, offered after the value is visible.

> **M006.2 update.** The consumer app was redesigned to feel like a product for
> *understanding a supermarket shop*, not a fiscal dashboard — a warm
> "cupom & caderno" visual language (`docs/consumer-ui.md`): paper ground, ink
> headline numbers, one grocery-green accent, hairline rows instead of stacked
> cards, `Bricolage Grotesque` display face. A real consumer **`/login` +
> `/cadastro`** replace the login-only flow (own chrome via `AuthShell`, no admin
> styling; `signUp` → auto `signIn`, with an inline confirmation step for a
> Cognito that needs it). After a successful sign-in/registration the trial's
> receipts are **claimed** into the account (`POST /api/anonymous-sessions/claim`);
> a trial user is invited to convert from the receipt screen, after seeing the
> insight. `GET /api/me` now answers `{ authenticated:false }` for a trial caller
> instead of a 500. The admin app is unchanged.

## Stack

React 19 + Vite 6 + TypeScript + Tailwind CSS v4 (unchanged from the starter).
The product UI is **pt-BR**; code, API and docs stay English.

## Information architecture

### Consumer app (`AppLayout` — header + primary nav, responsive; bottom tab bar on mobile)

| Route | Screen | Purpose |
|---|---|---|
| `/` | Landing **or** Dashboard | **M006.1:** with no session, the public `LandingPage` — value proposition + primary CTA "Experimente com sua nota fiscal" (starts an anonymous trial, → `/importar`). With a session (trial or authenticated), the Dashboard: headline numbers, **basket insight for the latest receipt**, gastos por mês, gastos por supermercado, compras recentes; polished empty state; a "dados não são salvos" notice in trial mode. |
| `/importar` | Import receipt | **M006.1:** leads with **📷 Ler QR Code** (live camera via `qr-scanner`, native `BarcodeDetector` when available) and **🖼 Enviar foto** (decode a photo in-browser); manual URL is the fallback under an "ou" divider. Decoded content is only hard-stopped by `classifyDecodedQr` when it is not a URL at all — any URL is sent to the backend, which is the authority on what it can import; the captured URL is kept so a failed import can retry without rescanning. Same friendly backend-error mapping (400 / 422 "só SP" / 502 / network). On success → receipt + resolution. |
| `/compras` | Purchases | list of imported receipts (data, supermercado, total, itens). Loading / empty / error states. |
| `/compras/:id` | Receipt detail | issuer header, access key, totais. **M006.1:** a `BasketInsight` card (categories + health selo) between totais and the item list. Full item list showing the **fiscal description verbatim** and, separately labelled, the **canonical product** when identified. Per-item `ResolutionBadge`. Payments. "Atualizar identificação" button. |

`/login` and the not-found page are unchanged in structure. `RootRoute` (M006.1)
replaces `RequireAuth` on the consumer shell: it allows an authenticated user or
an anonymous trial session through, and sends a sessionless visitor to `/`.

### Admin app (`AdminLayout` — deliberately darker/denser chrome so it is never mistaken for the consumer app)

| Route | Screen |
|---|---|
| `/admin` | operational counts (documentos, itens, identificados / não identificados, produtos, usuários) |
| `/admin/notas-fiscais` + `/admin/notas-fiscais/:id` | all fiscal documents (any owner), open one to inspect issuer / totais / itens / pagamentos. **M007:** "Reprocessar identificação" re-runs resolution for the document and shows per-item status / method / canonical product |
| `/admin/itens` | recent fiscal items across all documents, with resolution status |
| `/admin/resolucoes` | recent resolutions — fiscal text, status, method, canonical product, evidence count |
| `/admin/vocabulario` | **M007** — store vocabulary: list/filter `(store CNPJ, cProd) → produto` mappings, create (with a catalog product search), re-point, remove |
| `/admin/catalogo` | list / search canonical products |

## Authorization boundaries

- Every consumer screen shows only the **authenticated user's own** data — the
  M002/M005 ownership rules are untouched; a receipt or resolution that is not
  the caller's is a `404`.
- `/admin` is gated **server-side**: `SecurityConfig` maps `/api/admin/**` to
  `hasRole("ADMIN")`, where `ROLE_ADMIN` comes from the Cognito
  `cognito:groups` claim (`admin` group). A non-admin gets `403`.
- The frontend `RequireAdmin` guard and the hidden "Admin" nav link are
  convenience only — they decode the access token's groups client-side (see
  `src/auth/jwt.ts`) and are **not** a security boundary.
- The admin reads are platform-wide by design (debugging / product validation)
  and expose no consumer identity data — none is ever persisted (M006 §17).

## API additions (M006)

Read/aggregation only; all authenticated.

| Endpoint | Notes |
|---|---|
| `GET /api/dashboard/summary` | owner-scoped: `totalSpent`, `receiptCount`, `itemCount`, `resolvedItemCount`, `unresolvedItemCount`. Each figure is a scalar subquery — joining documents to items would fan out `SUM(total_amount)`. |
| `GET /api/dashboard/spending` | owner-scoped: `byMonth` (`YYYY-MM`, oldest first, America/São_Paulo) and `byIssuer` (biggest first). |
| `GET /api/fiscal-documents/{id}/resolutions` | owner-scoped: per-item resolution state for a receipt; `status = null` for items never resolved. Enriches the canonical product name from the Catalog. |
| `POST /api/fiscal-documents/{id}/resolutions` | owner-scoped: (re-)resolve every item of the receipt. Idempotent — delegates to the M005 per-item resolver. `GET /api/fiscal-documents/{id}` still does **not** auto-resolve. |
| `GET /api/admin/dashboard` | platform-wide counts. `ROLE_ADMIN`. |
| `GET /api/admin/fiscal-documents` / `/{id}` | list (200 most recent) / any document detail. `ROLE_ADMIN`. |
| `GET /api/admin/fiscal-items` | 200 most recent items + resolution status. `ROLE_ADMIN`. |
| `GET /api/admin/resolutions` | 200 most recent resolutions + evidence count. `ROLE_ADMIN`. |
| `GET /api/admin/catalog/products[?name=]` | list recent / deterministic name search (reuses `CatalogService`). `ROLE_ADMIN`. |

No cursor pagination in M006 — admin lists are capped at 200 rows.

## UX notes

- **Fiscal truth stays visible.** The receipt detail never replaces
  `rawDescription` with the canonical name; the canonical product is a separate,
  labelled line shown only when identified.
- **Unresolved is not an error.** An item with no canonical match renders a
  neutral "Não identificado" badge, not a failure.
- Currency is `R$` with pt-BR grouping; dates are `dd/mm/aaaa`; helpers live in
  `src/lib/format.ts`.
- Every data screen has explicit loading / empty / error states
  (`src/components/StateViews.tsx`); errors show a human message and a retry,
  never a raw API/stack string.
- Reusable primitives: `src/components/ui.tsx` (`Button`, `TextInput`, `Card`,
  `Badge`, `PageHeader`), `StatCard`, `SpendingBars` (pure-CSS chart),
  `ResolutionBadge`, `AppLayout` / `AdminLayout`. Not a design-system package.

## Manual acceptance flow

Login → Dashboard → Importar → paste a real São Paulo NFC-e QR URL → Import →
Receipt detail (inspect items, resolution) → Compras → back to Dashboard
(reflects the import) → `/admin` → Admin dashboard → Notas fiscais → open the
document → Itens → Resoluções → Catálogo. Each consumer screen was checked at
desktop and mobile widths.

## Deliberately not built (M006 §21)

Camera QR scanning, any resolution-algorithm expansion (fuzzy / AI / providers /
store vocabulary / candidate UI / confidence display), price / basket
intelligence, recommendations, shopping lists, household, aggregate market
analytics, a generalized analytics or design-system package, catalog editing.
