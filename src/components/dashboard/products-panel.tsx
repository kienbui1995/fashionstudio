import { useEffect, useRef, useState } from "react";
import { ImagePlus, PackagePlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fileToDataUrl } from "@/lib/image-pipeline";
import {
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
  type ProductStatus,
  formatPrice,
  useProductCatalog,
} from "@/lib/product-catalog";
import type { Shop } from "@/lib/shops-types";

const STATUS_LABEL: Record<ProductStatus, string> = {
  selling: "Đang bán",
  draft: "Nháp",
};

export function ProductsPanel({ shops }: { shops: Shop[] }) {
  const products = useProductCatalog((s) => s.products);
  const hydrate = useProductCatalog((s) => s.hydrate);
  const addProduct = useProductCatalog((s) => s.addProduct);
  const updateProduct = useProductCatalog((s) => s.updateProduct);
  const removeProduct = useProductCatalog((s) => s.removeProduct);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Áo");
  const [price, setPrice] = useState("");
  const [shopId, setShopId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filterShop, setFilterShop] = useState<string>("all");
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const visible =
    filterShop === "all"
      ? products
      : products.filter((p) => p.shopId === filterShop);

  function submit() {
    if (!name.trim()) {
      toast.error("Nhập tên sản phẩm");
      return;
    }
    const parsedPrice = price.trim() ? Number(price.replace(/[^\d]/g, "")) : null;
    addProduct({
      name,
      category,
      price: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
      shopId: shopId || null,
      imageUrl: imageUrl ?? undefined,
    });
    setName("");
    setPrice("");
    setImageUrl(null);
    toast.success(`Đã thêm ${name.trim()}`);
  }

  function remove(product: Product) {
    removeProduct(product.id);
    toast.success(`Đã xoá ${product.name}`);
  }

  return (
    <section>
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
        <p className="text-sm font-medium">Thêm sản phẩm vào catalog</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Tên sản phẩm — VD: Áo sơ mi linen"
            className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2 text-sm"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="numeric"
            placeholder="Giá (VND) — bỏ trống nếu chưa có"
            className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2 text-sm"
          />
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2 text-sm"
          >
            <option value="">Chưa gắn gian hàng</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  try {
                    setImageUrl(await fileToDataUrl(f));
                  } catch {
                    toast.error("Không đọc được ảnh");
                  }
                }
                e.target.value = "";
              }}
            />
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Ảnh sản phẩm"
                  className="size-12 rounded-[var(--radius-sm)] border border-border object-cover"
                />
                <button
                  type="button"
                  aria-label="Bỏ ảnh"
                  onClick={() => setImageUrl(null)}
                  className="absolute -right-1.5 -top-1.5 rounded-full border border-border bg-bg p-0.5 text-fg-muted hover:text-fg"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => photoRef.current?.click()}
              >
                <ImagePlus className="size-4" /> Ảnh (tuỳ chọn)
              </Button>
            )}
            <p className="text-xs text-fg-muted">
              Có ảnh để studio ghép thẳng sản phẩm vào look.
            </p>
          </div>
          <Button type="button" onClick={submit} className="sm:col-span-2">
            <PackagePlus className="size-4" /> Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <p className="text-xs text-fg-muted">Lọc theo gian hàng:</p>
        <button
          type="button"
          onClick={() => setFilterShop("all")}
          className={`rounded-full border px-3 py-1 text-xs ${
            filterShop === "all"
              ? "border-accent text-accent"
              : "border-border text-fg-muted"
          }`}
        >
          Tất cả ({products.length})
        </button>
        {shops.map((s) => {
          const count = products.filter((p) => p.shopId === s.id).length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilterShop(s.id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filterShop === s.id
                  ? "border-accent text-accent"
                  : "border-border text-fg-muted"
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      <ul className="mt-4 space-y-2">
        {visible.length === 0 && (
          <li className="rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center text-sm text-fg-muted">
            Chưa có sản phẩm. Thêm áo, quần, túi… để gắn vào look khi thử đồ.
          </li>
        )}
        {visible.map((p) => {
          const shop = shops.find((s) => s.id === p.shopId);
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
                  <Badge variant="outline">{p.category}</Badge>
                  <Badge variant={p.status === "selling" ? "accent" : "default"}>
                    {STATUS_LABEL[p.status]}
                  </Badge>
                  {shop && <Badge variant="outline">{shop.name}</Badge>}
                  <span className="font-medium text-fg">
                    {formatPrice(p.price)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateProduct(p.id, {
                      status: p.status === "selling" ? "draft" : "selling",
                    })
                  }
                >
                  {p.status === "selling" ? "Chuyển nháp" : "Bật bán"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Xoá ${p.name}`}
                  className="text-red-400 hover:text-red-300"
                  onClick={() => remove(p)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
