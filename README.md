# Carrinho Esperto — Frontend

The consumer + admin SPA for Carrinho Esperto. React 19 + Vite 6 + TypeScript +
Tailwind CSS v4 + Vitest. Calls Cognito directly for login (`USER_PASSWORD_AUTH`,
public client, no secret), then sends the access token to the backend as a
bearer credential.

The backend API lives in a separate repository: `carrinho-esperto-backend`.

## Docs

- `docs/frontend.md` — routes, authorization boundaries, the M006 spec
- `docs/consumer-ui.md` — the "cupom & caderno" consumer visual language

## Local development

The Vite dev server proxies `/api` → `http://localhost:8080` (backend) and
`/cognito` → `http://localhost:4566` (MiniStack). Start the backend repo first:

```bash
# in ../carrinho-esperto-backend:
docker compose up -d --wait
source infra/ministack/.cognito.env
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Then here:

```bash
cp .env.example .env                 # then set VITE_COGNITO_CLIENT_ID from the backend's .cognito.env
npm install
npm run dev                          # https://localhost:5173 (self-signed; needed for the QR camera)
```

## Tests / build

```bash
npm test                             # vitest run
npm run build                        # tsc -b && vite build
npm run lint
```
