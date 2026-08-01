# Google OAuth (production)

Domain mẫu: `https://fashionstudio.pmai.space`

## Google Cloud Console

1. [Credentials](https://console.cloud.google.com/apis/credentials) → Create **OAuth client ID** → **Web application**
2. **Authorized JavaScript origins**
   ```
   https://fashionstudio.pmai.space
   ```
3. **Authorized redirect URIs**
   ```
   https://fashionstudio.pmai.space/api/auth/callback/google
   ```

## Environment variables

Copy from [`.env.example`](../.env.example):

```bash
BETTER_AUTH_URL=https://fashionstudio.pmai.space
BETTER_AUTH_SECRET=   # openssl rand -hex 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=         # Postgres recommended
VITE_AUTH_ENABLED=true
```

Redeploy, then check `GET /api/oauth-status` → `googleDirect.configured: true`.

## Grok broker (optional)

Sandbox preview uses a built-in preview client (`*.grok-sandbox.com` only).  
Production must **not** rely on `grok_preview`. Prefer direct `GOOGLE_CLIENT_*` or a real `GROK_AUTH_CLIENT_ID` from the platform.
