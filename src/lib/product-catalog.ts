/** Product catalog persisted in localStorage (local-first, same as customer library). */

import { create } from "zustand";

const STORAGE_KEY = "fash-products-v1";

export const PRODUCT_CATEGORIES = [
  "Áo",
  "Quần",
  "Váy / Đầm",
  "Áo khoác",
  "Phụ kiện",
  "Khác",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductStatus = "selling" | "draft";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number | null;
  status: ProductStatus;
  shopId: string | null;
  note?: string;
  /** Optional photo (data URL) used by the studio when placing the product. */
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
};

type ProductCatalogState = {
  products: Product[];
  hydrated: boolean;
  hydrate: () => void;
  addProduct: (input: {
    name: string;
    category: ProductCategory;
    price?: number | null;
    status?: ProductStatus;
    shopId?: string | null;
    note?: string;
    imageUrl?: string;
  }) => string;
  updateProduct: (
    id: string,
    patch: Partial<
      Pick<
        Product,
        "name" | "category" | "price" | "status" | "shopId" | "note"
      >
    >,
  ) => void;
  removeProduct: (id: string) => void;
};

function uid() {
  return `prd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function load(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(products: Product[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    /* ignore quota */
  }
}

export function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return "—";
  return `${price.toLocaleString("vi-VN")}₫`;
}

export const useProductCatalog = create<ProductCatalogState>((set) => ({
  products: [],
  hydrated: false,

  hydrate() {
    if (useProductCatalog.getState().hydrated) return;
    set({ products: load(), hydrated: true });
  },

  addProduct({
    name,
    category,
    price = null,
    status = "selling",
    shopId = null,
    note,
    imageUrl,
  }) {
    const id = uid();
    const now = Date.now();
    const product: Product = {
      id,
      name: name.trim() || "Sản phẩm mới",
      category,
      price,
      status,
      shopId,
      note,
      imageUrl,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => {
      const products = [product, ...s.products];
      persist(products);
      return { products };
    });
    return id;
  },

  updateProduct(id, patch) {
    set((s) => {
      const products = s.products.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
      );
      persist(products);
      return { products };
    });
  },

  removeProduct(id) {
    set((s) => {
      const products = s.products.filter((p) => p.id !== id);
      persist(products);
      return { products };
    });
  },
}));
