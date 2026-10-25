"use client";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { CartLines, CartTotals } from "./CartLines";
import { useCart, useMounted } from "@/lib/cart";

export default function CartDrawer() {
  const mounted = useMounted();
  const { lines, open, setOpen } = useCart();
  if (!mounted || !open) return null;
  const close = () => setOpen(false);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl" role="dialog" aria-label="Shopping bag">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <h2 className="text-base font-medium">Your bag</h2>
          <button aria-label="Close" onClick={close} className="p-2"><X size={22} /></button>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag size={40} strokeWidth={1.25} className="text-muted" />
            <p className="text-sm text-muted">Your bag is empty. Let&apos;s fix that.</p>
            <Link href="/shop" onClick={close} className="btn btn-primary">Shop collection</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4"><CartLines onNavigate={close} /></div>
            <div className="space-y-3 border-t border-line p-4">
              <CartTotals lines={lines} />
              <Link href="/checkout" onClick={close} className="btn btn-primary w-full">Checkout</Link>
              <Link href="/cart" onClick={close} className="btn btn-outline w-full">View bag</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
