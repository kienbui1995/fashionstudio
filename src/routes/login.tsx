import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    seoHead({
      title: "Đăng nhập",
      description:
        "Đăng nhập Fash Studio để quản lý gian hàng local brand và studio try-on.",
      path: "/login",
      noindex: true,
    }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailAndPasswordEnabled) {
      toast.error("Email/password chưa bật");
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/dashboard",
      });
      if (error) throw new Error(error.message || "Đăng nhập thất bại");
      toast.success("Đăng nhập thành công");
      await navigate({ to: "/dashboard" });
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
        Vào dashboard gian hàng & studio try-on.
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
            {loading ? "Đang đăng nhập…" : "Đăng nhập email"}
          </Button>
        </form>
      )}

      {authEnabled && (
        <div className="mt-6 space-y-2">
          <p className="text-center text-xs text-fg-subtle">hoặc tiếp tục với</p>
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
                }).catch((err) => {
                  toast.error((err as Error).message || "OAuth lỗi");
                  setOauthLoading(null);
                });
              }}
            >
              {oauthLoading === p.providerId
                ? "Đang mở…"
                : `Tiếp tục với ${p.label}`}
            </Button>
          ))}
        </div>
      )}

      {!authEnabled && (
        <p className="mt-6 text-sm text-fg-muted">
          Auth đang tắt — dùng dev user.{" "}
          <Link to="/dashboard" className="text-accent">
            Vào dashboard
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
