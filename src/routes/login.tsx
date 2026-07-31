import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  getBearerToken,
  persistSessionToken,
  signIn,
} from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { seoHead } from "@/lib/seo";

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

function mapEmailError(message: string | undefined): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid") && (m.includes("password") || m.includes("email") || m.includes("credential"))) {
    return "Email hoặc mật khẩu không đúng";
  }
  if (m.includes("origin") || m.includes("forbidden")) {
    return "Domain chưa được phép (Invalid origin). Cần redeploy / set BETTER_AUTH_URL.";
  }
  if (m.includes("user not found") || m.includes("not found")) {
    return "Chưa có tài khoản với email này — hãy đăng ký trước";
  }
  return message || "Đăng nhập thất bại";
}

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
      const { data, error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error(mapEmailError(error.message));

      // Prefer full token from onSuccess header; fallback body token
      const bodyToken =
        (data as { token?: string } | null | undefined)?.token ?? null;
      if (!getBearerToken() && bodyToken) persistSessionToken(bodyToken);

      // Confirm session before leaving the page
      const session = await authClient.getSession();
      if (!session.data?.user && !getBearerToken() && !bodyToken) {
        throw new Error(
          "Đăng nhập xong nhưng chưa giữ được phiên (cookie). Thử lại hoặc dùng trình duyệt khác.",
        );
      }

      toast.success("Đăng nhập thành công");
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
        Vào bảng điều khiển gian hàng & studio thử đồ.
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
          <p className="pt-1 text-center text-[11px] leading-relaxed text-fg-subtle">
            Google/X cần OAuth trên domain production. Nếu lỗi, dùng{" "}
            <strong className="text-fg-muted">email + mật khẩu</strong> (ổn định
            hơn).
          </p>
        </div>
      )}

      {!authEnabled && (
        <p className="mt-6 text-sm text-fg-muted">
          Auth đang tắt — dùng tài khoản dev.{" "}
          <Link to="/dashboard" className="text-accent">
            Vào bảng điều khiển
          </Link>
        </p>
      )}

      <p className="mt-8 text-sm text-fg-muted">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="text-accent">
          Đăng ký gian hàng
        </Link>
      </p>
    </div>
  );
}
