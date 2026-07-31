/** Minimal multi-shop client state (active shop id). */

import { create } from "zustand";

const STORAGE_KEY = "fash-active-shop-v1";

export type ShopSummary = {
  id: string;
  name: string;
  slug?: string;
};

type ShopClientState = {
  activeShopId: string | null;
  shops: ShopSummary[];
  setActiveShopId: (id: string | null) => void;
  setShops: (shops: ShopSummary[]) => void;
  upsertShop: (shop: ShopSummary) => void;
  hydrate: () => void;
};

function readStoredId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const useShopClient = create<ShopClientState>((set, get) => ({
  activeShopId: null,
  shops: [],

  hydrate() {
    const id = readStoredId();
    if (id) set({ activeShopId: id });
  },

  setActiveShopId(id) {
    writeStoredId(id);
    set({ activeShopId: id });
  },

  setShops(shops) {
    set({ shops });
    const active = get().activeShopId;
    if (active && !shops.some((s) => s.id === active)) {
      const next = shops[0]?.id ?? null;
      writeStoredId(next);
      set({ activeShopId: next });
    } else if (!active && shops[0]) {
      writeStoredId(shops[0].id);
      set({ activeShopId: shops[0].id });
    }
  },

  upsertShop(shop) {
    set((s) => {
      const exists = s.shops.some((x) => x.id === shop.id);
      const shops = exists
        ? s.shops.map((x) => (x.id === shop.id ? { ...x, ...shop } : x))
        : [...s.shops, shop];
      return { shops };
    });
    if (!get().activeShopId) {
      get().setActiveShopId(shop.id);
    }
  },
}));

export function getActiveShopId(): string | null {
  return useShopClient.getState().activeShopId;
}
