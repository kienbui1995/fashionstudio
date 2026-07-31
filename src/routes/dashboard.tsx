import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  type Shop,
  canRole,
  createShopLocal,
  loadShops,
} from "@/lib/shops-types";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    seoHead({
      title: "Dashboard gian hàng",
      description: "Bảng điều khiển gian hàng Fash Studio.",
      path: "/dashboard",
      noindex: true,
    }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  const [shops, setShops] = useState<Shop[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setShops(loadShops());
  }, []);

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-muted" />
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-bg-muted" />
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;

  function createShop() {
    const shop = createShopLocal(name.trim() || "Gian hàng mới");
    setShops(loadShops());
    setName("");
    toast.success(`Đã tạo ${shop.name}`);
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link to="/" className="font-display font-semibold">
          Fash Studio
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link to="/studio">Mở Studio</Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Dashboard gian hàng</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Xin chào {user.displayName || user.primaryEmail || "bạn"}. Quản lý shop
          local (lưu trên thiết bị — không cần DB).
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên gian hàng…"
            className="flex-1 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm"
          />
          <Button type="button" onClick={createShop}>
            <Plus className="size-4" /> Tạo shop
          </Button>
        </div>

        <ul className="mt-8 space-y-3">
          {shops.length === 0 && (
            <li className="rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center text-sm text-fg-muted">
              Chưa có gian hàng. Tạo một shop để gắn brand watermark & SEO.
            </li>
          )}
          {shops.map((shop) => (
            <li
              key={shop.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4"
            >
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 size-5 text-accent" />
                <div>
                  <p className="font-medium">{shop.name}</p>
                  <p className="text-xs text-fg-muted">/{shop.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="accent">{shop.role}</Badge>
                    {canRole(shop.role, "editor") && (
                      <Badge variant="outline">Có thể xuất look</Badge>
                    )}
                    {canRole(shop.role, "admin") && (
                      <Badge variant="outline">Quản trị team</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to="/studio">Vào Studio</Link>
              </Button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
