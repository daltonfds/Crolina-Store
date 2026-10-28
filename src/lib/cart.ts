"use client";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lineTotal } from "@/lib/pricing";

export type CartLine = {
  id: string; slug: string; name: string; category?: string; price: number; image: string | null; qty: number; max: number; link?: string | null; b3?: number | null; b6?: number | null;
};

type CartState = {
  lines: CartLine[];
  open: boolean;
  add: (l: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setOpen: (o: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (l, qty = 1) =>
        set((s) => {
          const max = Math.max(1, Math.min(l.max, 10));
          const ex = s.lines.find((x) => x.id === l.id);
          const lines = ex
            ? s.lines.map((x) => (x.id === l.id ? { ...x, ...l, max, qty: Math.min(x.qty + qty, max) } : x))
            : [...s.lines, { ...l, max, qty: Math.min(qty, max) }];
          return { lines, open: true };
        }),
      setQty: (id, qty) =>
        set((s) => ({ lines: s.lines.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(qty, x.max)) } : x)) })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((x) => x.id !== id) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: "crolina-cart", partialize: (s) => ({ lines: s.lines }) },
  ),
);

export const cartSubtotal = (lines: CartLine[]) => lines.reduce((t, l) => t + lineTotal(l.price, l.qty, { b3: l.b3, b6: l.b6 }), 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((t, l) => t + l.qty, 0);

type FavState = { ids: string[]; toggle: (id: string) => void };
export const useFavs = create<FavState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
    }),
    { name: "crolina-favs" },
  ),
);

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
