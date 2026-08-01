import { useState } from "react";
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
import { registerEmailHybrid } from "@/lib/auth/local-session";
import { createShopLocal } from "@/lib/shops-types";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/register")({
  head: () =>
    seoHead({
      title: "Đăng ký gian hàng local brand",
      description:
        "Tạo tài khoản Fash Studio — studio thử đồ, video TikTok và vận hành SME thời trang Việt.",
      path: "/register",
      keywords: ["đăng ký local brand", "tạo shop thời trang online"],
    }),
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailAndPasswordEnabled) {
      toast.error("Chưa bật đăng ký email");
      return;
    }
    if (password.length < 8) {
      toast.error("Mật khẩu tối thiểu 8 ký tự");
      return;
    }
    setLoading(true);
    try {
      const result = await registerEmailHybrid({
        email,
        password,
        name: name.trim() || "Chủ shop",
        betterAuthSignUp: async (args) => {
          const res = await authClient.signUp.email({
            email: args.email,
            password: args.password,
            name: args.name,
          });
          return res;
        },
        persistToken: (token) => persistSessionToken(token),
      });
      if (shopName.trim()) createShopLocal(shopName.trim());
      toast.success(
        result.source === "server"
          ? "Tạo tài khoản thành công"
          : "Tạo tài khoản trên thiết bị thành công — có thể đăng nhập ngay",
      );
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-6 text-sm text-accent">
        ← Về trang chủ
      </Link>
      <h1 className="font-display text-2xl font-semibold">Đăng ký gian hàng</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Tạo tài khoản bằng email để vào studio + bảng điều khiển.
      </p>

      {authEnabled && emailAndPasswordEnabled && (
        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <label className="block text-xs text-fg-muted">
            Họ tên
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm"
              autoComplete="name"
            />
          </label>
          <label className="block text-xs text-fg-muted">
            Tên gian hàng (tuỳ chọn)
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="VD: Atelier Hà Nội"
              className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-fg-muted">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-fg-muted">
            Mật khẩu (tối thiểu 8 ký tự)
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang tạo…" : "Tạo tài khoản"}
          </Button>
        </form>
      )}

      {authEnabled && (
        <div className="mt-6 space-y-2">
          <p className="text-center text-xs text-fg-subtle">hoặc đăng ký bằng</p>
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                void signIn(p.providerId, {
                  callbackURL: "/dashboard",
                  errorCallbackURL: "/register",
                }).catch((err) =>
                  toast.error(
                    (err as Error).message ||
                      "Google/X lỗi — hãy đăng ký bằng email",
                  ),
                )
              }
            >
              Dùng {p.label}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link to="/studio">Vào studio ngay</Link>
        </Button>
      </div>

      <p className="mt-8 text-sm text-fg-muted">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-accent">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
