/** Minimal shop types for SME dashboard (local-first, no DB required). */

export type ShopRole = "owner" | "admin" | "editor" | "viewer";

export type Shop = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  role: ShopRole;
};

export const ROLE_RANK: Record<ShopRole, number> = {
  owner: 40,
  admin: 30,
  editor: 20,
  viewer: 10,
};

export function canRole(role: ShopRole, min: ShopRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export function slugifyShop(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "shop";
}

const STORAGE_KEY = "fash-studio.shops.v1";

export function loadShops(): Shop[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Shop[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveShops(shops: Shop[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
  } catch {
    /* ignore */
  }
}

export function createShopLocal(name: string, role: ShopRole = "owner"): Shop {
  const cleaned = name.trim() || "Gian hàng mới";
  const shop: Shop = {
    id: `shop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: cleaned,
    slug: slugifyShop(cleaned),
    createdAt: new Date().toISOString(),
    role,
  };
  const next = [shop, ...loadShops()];
  saveShops(next);
  return shop;
}
