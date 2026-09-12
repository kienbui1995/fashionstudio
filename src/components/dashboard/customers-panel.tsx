import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ImagePlus, Phone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCustomerLibrary } from "@/lib/customer-library";

export function CustomersPanel() {
  const customers = useCustomerLibrary((s) => s.customers);
  const hydrate = useCustomerLibrary((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const totalAssets = customers.reduce((sum, c) => sum + c.assets.length, 0);

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <Users className="size-4 text-accent" /> Khách hàng
          </div>
          <p className="mt-1 font-display text-2xl font-semibold">
            {customers.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <ImagePlus className="size-4 text-accent" /> Ảnh mẫu & sản phẩm đã lưu
          </div>
          <p className="mt-1 font-display text-2xl font-semibold">
            {totalAssets}
          </p>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {customers.length === 0 && (
          <li className="rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center text-sm text-fg-muted">
            Chưa có khách hàng. Thêm khách trong tab “Khách hàng” của studio để
            gắn look đã xuất với từng người.
          </li>
        )}
        {customers.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                {c.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" /> {c.phone}
                  </span>
                )}
                <Badge variant="outline">{c.assets.length} ảnh</Badge>
                <span>
                  cập nhật{" "}
                  {new Date(c.updatedAt).toLocaleDateString("vi-VN")}
                </span>
              </p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link to="/studio">Xuất look cho khách</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
