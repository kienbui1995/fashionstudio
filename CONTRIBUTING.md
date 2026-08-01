# Contributing

Thanks for helping improve Fash Studio.

## Setup

```bash
npm install
cp .env.example .env.local
# fill secrets as needed
npm run dev
```

App listens on `http://127.0.0.1:8080`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Guidelines

- Keep PRs focused and small.
- Do not commit secrets, `node_modules`, or QA screenshots under `screenshots/qa/`.
- Prefer Vietnamese UI strings for product surfaces; English OK for code comments.
- Auth: see `docs/OAUTH_PRODUCTION.md` and `.env.example`.

## Code of conduct

Be respectful. Harassment or abuse is not accepted.
