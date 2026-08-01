# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email the maintainers or open a **private** security advisory on GitHub.

Include:

- Affected version / commit
- Steps to reproduce
- Impact (auth bypass, data leak, XSS, etc.)

## Secrets

Never commit:

- `.env`, `.env.local`, real `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_SECRET`, `GROK_AUTH_CLIENT_SECRET`, `DATABASE_URL`
- API tokens, private keys

Use [`.env.example`](./.env.example) as the template only.

## Auth notes

- Production Google OAuth uses `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- The baked-in Grok **preview** OAuth client is only valid for `*.grok-sandbox.com` live previews — not for public production domains.
