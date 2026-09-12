import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Package, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomersPanel } from "@/components/dashboard/customers-panel";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { ProductsPanel } from "@/components/dashboard/products-panel";
import { ShopsPanel } from "@/components/dashboard/shops-panel";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useCustomerLibrary } from "@/lib/customer-library";
import { useProductCatalog } from "@/lib/product-catalog";
import { type Shop, loadShops } from "@/lib/shops-types";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    seoHead({
      title: "Bảng điều khiển gian hàng",
      description: "Bảng điều khiển gian hàng Fash Studio.",
      path: "/dashboard",
      noindex: true,
    }),
  component: DashboardPage,
});

type DashboardSection = "overview" | "products" | "shops" | "customers";

const SECTIONS: Array<{
  id: DashboardSection;
  label: string;
  icon: typeof Store;
}> = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "products", label: "Sản phẩm", icon: Package },
  { id: "shops", label: "Gian hàng", icon: Store },
  { id: "customers", label: "Khách hàng", icon: Users },
];

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  const [shops, setShops] = useState<Shop[]>([]);
  const [section, setSection] = useState<DashboardSection>("overview");
  // SSR and the first client render must match (local session is client-only),
  // so hold the skeleton until after mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);

  const hydrateProducts = useProductCatalog((s) => s.hydrate);
  const hydrateCustomers = useCustomerLibrary((s) => s.hydrate);

  useEffect(() => {
    setMounted(true);
    setShops(loadShops());
    hydrateProducts();
    hydrateCustomers();
  }, [hydrateProducts, hydrateCustomers]);

  function refreshShops() {
    setShops(loadShops());
  }

  if (!mounted || isPending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-muted" />
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-bg-muted" />
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link to="/" className="font-display font-semibold">
          Fash Studio
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link to="/studio">Mở studio</Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">
          Bảng điều khiển gian hàng
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Xin chào {user.displayName || user.primaryEmail || "bạn"}. Quản lý shop
          trên thiết bị này (lưu local, chưa cần máy chủ).
        </p>

        <nav className="mt-6 flex flex-wrap gap-1.5 border-b border-border pb-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                section === s.id
                  ? "bg-accent/20 text-accent"
                  : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
              }`}
            >
              <s.icon className="size-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {section === "overview" && (
            <OverviewPanel shops={shops} onGoTo={setSection} />
          )}
          {section === "products" && <ProductsPanel shops={shops} />}
          {section === "shops" && (
            <ShopsPanel shops={shops} onShopsChange={refreshShops} />
          )}
          {section === "customers" && <CustomersPanel />}
        </div>
      </main>
    </div>
  );
}
