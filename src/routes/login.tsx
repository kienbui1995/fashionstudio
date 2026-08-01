import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  persistSessionToken,
  signIn,
} from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { loginEmailHybrid } from "@/lib/auth/local-session";
import { seoHead } from "@/lib/seo";


function OAuthSetupHint() {
  const [status, setStatus] = useState<{
    googleDirect?: { configured?: boolean; callbackUrl?: string };
    grokBroker?: { usingPreviewClient?: boolean };
  } | null>(null);

  useEffect(() => {
    void fetch("/api/oauth-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const googleOk = status?.googleDirect?.configured;
  const previewOnly = status?.grokBroker?.usingPreviewClient;

  return (
    <details className="mt-8 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 text-xs text-fg-muted">
      <summary className="cursor-pointer font-medium text-fg">
        Cấu hình Google OAuth production
        {googleOk === true && (
          <span className="ml-2 text-accent">· Đã bật Google trực tiếp</span>
        )}
        {googleOk === false && previewOnly && (
          <span className="ml-2 text-danger">· Chưa cấu hình</span>
        )}
      </summary>
      <ol className="mt-3 list-decimal space-y-1.5 pl-4 leading-relaxed">
        <li>
          Google Cloud Console → APIs & Services → Credentials → Create
          OAuth client (Web).
        </li>
        <li>
          <strong className="text-fg">Authorized JavaScript origins:</strong>{" "}
          <code className="text-accent">https://fashionstudio.pmai.space</code>
        </li>
        <li>
          <strong className="text-fg">Authorized redirect URIs:</strong>{" "}
          <code className="break-all text-accent">
            {status?.googleDirect?.callbackUrl ||
              "https://fashionstudio.pmai.space/api/auth/callback/google"}
          </code>
        </li>
        <li>
          Trên host deploy (Vercel/…), set env:
          <pre className="mt-1 overflow-x-auto rounded bg-bg p-2 text-[10px] text-fg">
{`BETTER_AUTH_URL=https://fashionstudio.pmai.space
BETTER_AUTH_SECRET=<chuỗi ngẫu nhiên dài>
GOOGLE_CLIENT_ID=<Client ID>
GOOGLE_CLIENT_SECRET=<Client Secret>
DATABASE_URL=<postgres>`}
          </pre>
        </li>
        <li>Redeploy → bấm <strong className="text-fg">Dùng Google</strong>.</li>
      </ol>
      <p className="mt-3 text-[11px] text-fg-subtle">
        Kiểm tra:{" "}
        <a className="text-accent" href="/api/oauth-status" target="_blank" rel="noreferrer">
          /api/oauth-status
        </a>
      </p>
    </details>
  );
}

export const Route = createFileRoute("/login")({
  head: () =>
    seoHead({
      title: "Đăng nhập",
      description:
        "Đăng nhập Fash Studio để quản lý gian hàng local brand và studio thử đồ.",
      path: "/login",
      noindex: true,
    }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailAndPasswordEnabled) {
      toast.error("Chưa bật đăng nhập email");
      return;
    }
    setLoading(true);
    try {
      const result = await loginEmailHybrid({
        email,
        password,
        betterAuthSignIn: async (args) => {
          const res = await authClient.signIn.email({
            email: args.email,
            password: args.password,
          });
          return res;
        },
        persistToken: (token) => persistSessionToken(token),
      });
      toast.success(
        result.source === "server"
          ? "Đăng nhập thành công"
          : "Đăng nhập thành công (tài khoản trên thiết bị)",
      );
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-6 text-sm text-accent">
        ← Về trang chủ
      </Link>
      <h1 className="font-display text-2xl font-semibold">Đăng nhập</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Dùng email đã đăng ký trên thiết bị này, hoặc Google/X nếu đã cấu hình.
      </p>

      {authEnabled && emailAndPasswordEnabled && (
        <form onSubmit={onEmailSubmit} className="mt-8 space-y-3">
          <label className="block text-xs text-fg-muted">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm text-fg"
            />
          </label>
          <label className="block text-xs text-fg-muted">
            Mật khẩu
            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm text-fg"
            />
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập…" : "Đăng nhập bằng email"}
          </Button>
          <p className="text-[11px] leading-relaxed text-fg-subtle">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-accent">
              Đăng ký
            </Link>{" "}
            trước. Sau mỗi lần deploy server, nếu quên mật khẩu hãy đăng ký lại
            cùng email trên thiết bị này.
          </p>
        </form>
      )}

      {authEnabled && (
        <div className="mt-6 space-y-2">
          <p className="text-center text-xs text-fg-subtle">hoặc đăng nhập bằng</p>
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="w-full"
              disabled={oauthLoading === p.providerId}
              onClick={() => {
                setOauthLoading(p.providerId);
                void signIn(p.providerId, {
                  callbackURL: "/dashboard",
                  errorCallbackURL: "/login",
                })
                  .catch((err) => {
                    toast.error(
                      (err as Error).message ||
                        "Google/X lỗi — hãy dùng email/mật khẩu",
                    );
                  })
                  .finally(() => setOauthLoading(null));
              }}
            >
              {oauthLoading === p.providerId
                ? "Đang mở…"
                : `Dùng ${p.label}`}
            </Button>
          ))}
          <p className="pt-1 text-center text-[11px] text-fg-subtle">
            Google/X có thể lỗi trên domain mới. Email luôn hoạt động sau khi
            đăng ký.
          </p>
        </div>
      )}

      <p className="mt-8 text-sm text-fg-muted">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="text-accent">
          Đăng ký gian hàng
        </Link>
      </p>

      <OAuthSetupHint />
    </div>
  );
}
