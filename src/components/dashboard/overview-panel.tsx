import { Link } from "@tanstack/react-router";
import {
  ImageIcon,
  Package,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerLibrary } from "@/lib/customer-library";
import { useProductCatalog } from "@/lib/product-catalog";
import type { Shop } from "@/lib/shops-types";

export function OverviewPanel({
  shops,
  onGoTo,
}: {
  shops: Shop[];
  onGoTo: (section: "shops" | "products" | "customers") => void;
}) {
  const products = useProductCatalog((s) => s.products);
  const customers = useCustomerLibrary((s) => s.customers);
  const assets = customers.reduce((sum, c) => sum + c.assets.length, 0);
  const selling = products.filter((p) => p.status === "selling").length;

  const stats = [
    {
      label: "Gian hàng",
      value: shops.length,
      icon: Store,
      section: "shops" as const,
    },
    {
      label: "Sản phẩm",
      value: products.length,
      sub: `${selling} đang bán`,
      icon: Package,
      section: "products" as const,
    },
    {
      label: "Khách hàng",
      value: customers.length,
      icon: Users,
      section: "customers" as const,
    },
    {
      label: "Ảnh mẫu / sản phẩm",
      value: assets,
      icon: ImageIcon,
      section: "customers" as const,
    },
  ];

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onGoTo(s.section)}
            className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 text-left transition-colors hover:border-accent"
          >
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <s.icon className="size-4 text-accent" /> {s.label}
            </div>
            <p className="mt-1 font-display text-3xl font-semibold">{s.value}</p>
            {s.sub && <p className="text-xs text-fg-muted">{s.sub}</p>}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <p className="text-sm font-medium">Bắt đầu nhanh</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/studio">Mở studio thử đồ</Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onGoTo("products")}>
            Thêm sản phẩm
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onGoTo("shops")}>
            Tạo gian hàng
          </Button>
        </div>
        <p className="mt-4 text-xs text-fg-muted">
          Quy trình gợi ý: tạo gian hàng → thêm sản phẩm → vào studio ghép look
          & xuất video TikTok → xuất look cho khách.
        </p>
      </div>
    </section>
  );
}
