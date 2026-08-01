import { createFileRoute } from "@tanstack/react-router";

/**
 * Public, non-secret status for production OAuth setup (no client secrets).
 * GET /api/oauth-status
 */
export const Route = createFileRoute("/api/oauth-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = (k: string) => {
          const v = process.env[k]?.trim();
          return v ? v : undefined;
        };
        const origin = new URL(request.url).origin;
        const betterAuthUrl = env("BETTER_AUTH_URL") || origin;
        const hasGoogle = Boolean(
          env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET"),
        );
        const hasGrokClient = Boolean(
          env("GROK_AUTH_CLIENT_ID") && env("GROK_AUTH_CLIENT_SECRET"),
        );
        const usingPreviewClient =
          !env("GROK_AUTH_CLIENT_ID") ||
          env("GROK_AUTH_CLIENT_ID") === "grok_preview";

        const body = {
          ok: true,
          origin,
          betterAuthUrl,
          googleDirect: {
            configured: hasGoogle,
            callbackUrl: `${betterAuthUrl.replace(/\/$/, "")}/api/auth/callback/google`,
          },
          grokBroker: {
            configured: hasGrokClient,
            usingPreviewClient,
            issuer: env("GROK_AUTH_ISSUER") || "https://auth.grok.me",
            callbackGoogle: `${betterAuthUrl.replace(/\/$/, "")}/api/auth/oauth2/callback/grok-google`,
            note: usingPreviewClient
              ? "Preview client only allows *.grok-sandbox.com — set GROK_AUTH_CLIENT_ID for production OR use GOOGLE_CLIENT_ID."
              : "Using per-app Grok broker client.",
          },
          database: {
            postgres: Boolean(env("DATABASE_URL")),
          },
          recommendedEnv: [
            "BETTER_AUTH_URL=https://fashionstudio.pmai.space",
            "BETTER_AUTH_SECRET=<random-32+-chars>",
            "GOOGLE_CLIENT_ID=<from Google Cloud Console>",
            "GOOGLE_CLIENT_SECRET=<from Google Cloud Console>",
            "DATABASE_URL=<postgres connection string>",
          ],
          googleCloudSteps: [
            "Mở https://console.cloud.google.com/apis/credentials",
            "Tạo OAuth client ID loại Web application",
            "Authorized JavaScript origins: https://fashionstudio.pmai.space",
            "Authorized redirect URIs: https://fashionstudio.pmai.space/api/auth/callback/google",
            "Copy Client ID + Client Secret vào env GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
            "Redeploy app",
          ],
        };

        return new Response(JSON.stringify(body, null, 2), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
