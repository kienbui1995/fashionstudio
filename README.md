# Fash Studio

Studio try-on thời trang cho **local brand / SME Việt Nam**: tách nền AI, ghép mẫu + sản phẩm, watermark, video TikTok 9:16, SEO caption, đăng ký gian hàng.

> Open-source · React 19 · TanStack Start · Vite · Tailwind · Better Auth

## Features

- **Try-on canvas** — mẫu + layer sản phẩm (kéo/cỡ/xoay), cảnh VN & Gen Z
- **Tách nền AI** (`@imgly/background-removal`) + fallback nhanh
- **Watermark** thương hiệu (text / logo)
- **Video Reels / TikTok** 9:16 + pack SEO / Shop checklist
- **AI nội dung** caption & listing (client templates)
- **Auth** email + Google OAuth (production) / Grok broker (preview)
- **Dashboard** gian hàng (local-first)

## Quick start

```bash
git clone <your-repo-url> fash-studio
cd fash-studio
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Environment

See [`.env.example`](./.env.example) and [docs/OAUTH_PRODUCTION.md](./docs/OAUTH_PRODUCTION.md).

| Variable | Required | Notes |
|----------|----------|--------|
| `BETTER_AUTH_URL` | prod | e.g. `https://fashionstudio.pmai.space` |
| `BETTER_AUTH_SECRET` | prod | `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google login | Google Cloud Web client |
| `DATABASE_URL` | prod | Postgres; empty → PGLite (dev only) |
| `AI_API_KEY` | AI content | OpenAI-compatible key (Z.ai/GLM, Gemini, OpenAI…); empty → offline templates |
| `AI_API_BASE` | AI content | default `https://api.z.ai/api/paas/v4` |
| `AI_MODEL` | AI content | default `glm-4.6` |
| `VITE_AUTH_ENABLED` | optional | default on; `"false"` disables auth |

**Never commit real secrets.**

Google redirect URI:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

Status endpoint (no secrets): `GET /api/oauth-status`

## Scripts

```bash
npm run dev          # 0.0.0.0:8080
npm run build        # production build + migrations
npm run typecheck
npm run lint
```

## Project layout

```text
src/
  routes/          # pages (/, /studio, /login, /dashboard, …)
  lib/auth/        # Better Auth client + server
  lib/             # image pipeline, video, TikTok SEO, store
  components/      # UI + SME panels
public/            # static assets
migrations/        # Better Auth schema
docs/              # OAuth & ops notes
```

## License

[MIT](./LICENSE)

## Security

See [SECURITY.md](./SECURITY.md).
