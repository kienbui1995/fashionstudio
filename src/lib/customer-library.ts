/** Customer + asset library persisted in localStorage. */

import { create } from "zustand";

const STORAGE_KEY = "fash-customers-v1";

export type CustomerAssetKind = "model" | "product";

export type CustomerAsset = {
  id: string;
  kind: CustomerAssetKind;
  name: string;
  src: string;
  createdAt: number;
  note?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  assets: CustomerAsset[];
};

type CustomerLibraryState = {
  customers: Customer[];
  activeCustomerId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  addCustomer: (input: { name: string; phone?: string; note?: string }) => string;
  updateCustomer: (
    id: string,
    patch: Partial<Pick<Customer, "name" | "phone" | "note">>,
  ) => void;
  removeCustomer: (id: string) => void;
  setActiveCustomer: (id: string | null) => void;
  addAsset: (
    customerId: string,
    asset: Omit<CustomerAsset, "id" | "createdAt">,
  ) => string;
  removeAsset: (customerId: string, assetId: string) => void;
  getActiveCustomer: () => Customer | undefined;
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function load(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Customer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(customers: Customer[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch {
    /* ignore quota */
  }
}

export const useCustomerLibrary = create<CustomerLibraryState>((set, get) => ({
  customers: [],
  activeCustomerId: null,
  hydrated: false,

  hydrate() {
    if (get().hydrated) return;
    const customers = load();
    set({
      customers,
      hydrated: true,
      activeCustomerId: customers[0]?.id ?? null,
    });
  },

  addCustomer({ name, phone, note }) {
    const id = uid("cus");
    const now = Date.now();
    const customer: Customer = {
      id,
      name: name.trim() || "Khách mới",
      phone,
      note,
      createdAt: now,
      updatedAt: now,
      assets: [],
    };
    set((s) => {
      const customers = [customer, ...s.customers];
      persist(customers);
      return { customers, activeCustomerId: id };
    });
    return id;
  },

  updateCustomer(id, patch) {
    set((s) => {
      const customers = s.customers.map((c) =>
        c.id === id
          ? { ...c, ...patch, updatedAt: Date.now() }
          : c,
      );
      persist(customers);
      return { customers };
    });
  },

  removeCustomer(id) {
    set((s) => {
      const customers = s.customers.filter((c) => c.id !== id);
      persist(customers);
      return {
        customers,
        activeCustomerId:
          s.activeCustomerId === id
            ? customers[0]?.id ?? null
            : s.activeCustomerId,
      };
    });
  },

  setActiveCustomer(id) {
    set({ activeCustomerId: id });
  },

  addAsset(customerId, asset) {
    const id = uid("asset");
    const full: CustomerAsset = {
      ...asset,
      id,
      createdAt: Date.now(),
    };
    set((s) => {
      const customers = s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              updatedAt: Date.now(),
              assets: [full, ...c.assets].slice(0, 64),
            }
          : c,
      );
      persist(customers);
      return { customers };
    });
    return id;
  },

  removeAsset(customerId, assetId) {
    set((s) => {
      const customers = s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              updatedAt: Date.now(),
              assets: c.assets.filter((a) => a.id !== assetId),
            }
          : c,
      );
      persist(customers);
      return { customers };
    });
  },

  getActiveCustomer() {
    const { customers, activeCustomerId } = get();
    return customers.find((c) => c.id === activeCustomerId);
  },
}));
