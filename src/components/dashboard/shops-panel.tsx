import { useState } from "react";
import { Check, Pencil, Plus, Store, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type Shop,
  canRole,
  createShopLocal,
  removeShopLocal,
  updateShopLocal,
} from "@/lib/shops-types";
import { useShopClient } from "@/lib/shop-client";

const ROLE_LABEL: Record<Shop["role"], string> = {
  owner: "Chủ shop",
  admin: "Quản trị",
  editor: "Biên tập",
  viewer: "Xem only",
};

export function ShopsPanel({
  shops,
  onShopsChange,
}: {
  shops: Shop[];
  onShopsChange: () => void;
}) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const activeShopId = useShopClient((s) => s.activeShopId);
  const setActiveShopId = useShopClient((s) => s.setActiveShopId);

  function createShop() {
    const shop = createShopLocal(name.trim() || "Gian hàng mới");
    setName("");
    onShopsChange();
    setActiveShopId(shop.id);
    toast.success(`Đã tạo ${shop.name}`);
  }

  function saveRename(id: string) {
    const updated = updateShopLocal(id, { name: editName });
    if (updated) toast.success(`Đã đổi tên thành ${updated.name}`);
    setEditingId(null);
    onShopsChange();
  }

  function removeShop(shop: Shop) {
    if (!window.confirm(`Xoá gian hàng "${shop.name}"?`)) return;
    removeShopLocal(shop.id);
    if (activeShopId === shop.id) setActiveShopId(null);
    onShopsChange();
    toast.success(`Đã xoá ${shop.name}`);
  }

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createShop()}
          placeholder="Tên gian hàng mới…"
          className="flex-1 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-sm"
        />
        <Button type="button" onClick={createShop}>
          <Plus className="size-4" /> Tạo gian hàng
        </Button>
      </div>

      <ul className="mt-6 space-y-3">
        {shops.length === 0 && (
          <li className="rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center text-sm text-fg-muted">
            Chưa có gian hàng. Tạo một shop để gắn brand watermark & SEO.
          </li>
        )}
        {shops.map((shop) => {
          const isActive = shop.id === activeShopId;
          return (
            <li
              key={shop.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4"
            >
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 size-5 text-accent" />
                <div>
                  {editingId === shop.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(shop.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-52 rounded-[var(--radius-sm)] border border-border bg-bg px-2 py-1 text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        aria-label="Lưu tên"
                        onClick={() => saveRename(shop.id)}
                        className="text-accent"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Bỏ sửa"
                        onClick={() => setEditingId(null)}
                        className="text-fg-muted"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium">
                      {shop.name}
                      {isActive && (
                        <Badge variant="accent" className="ml-2">
                          Đang chọn
                        </Badge>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-fg-muted">/{shop.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{ROLE_LABEL[shop.role]}</Badge>
                    {canRole(shop.role, "editor") && (
                      <Badge variant="outline">Xuất look</Badge>
                    )}
                    {canRole(shop.role, "admin") && (
                      <Badge variant="outline">Quản trị đội nhóm</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isActive && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setActiveShopId(shop.id);
                      toast.success(`Đang làm việc với ${shop.name}`);
                    }}
                  >
                    Chọn
                  </Button>
                )}
                {editingId !== shop.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Đổi tên ${shop.name}`}
                    onClick={() => {
                      setEditingId(shop.id);
                      setEditName(shop.name);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Xoá ${shop.name}`}
                  className="text-red-400 hover:text-red-300"
                  onClick={() => removeShop(shop)}
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
