"use client";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import ProductThumb from "./ProductThumb";
import { STORE, shippingFor } from "@/lib/config";
import { cartSubtotal, useCart, type CartLine } from "@/lib/cart";
import { formatZAR } from "@/lib/money";

export function CartLines({ onNavigate }: { onNavigate?: () => void }) {
  const { lines, setQty, remove } = useCart();
  return (
    <ul className="divide-y divide-line">
      {lines.map((l) => (
        <li key={l.id} className="flex gap-3 py-4">
          <Link href={`/product/${l.slug}`} onClick={onNavigate} className="w-20 shrink-0">
            <ProductThumb
              product={{ id: l.id, name: l.name, category: "", image_urls: l.image ? [l.image] : [] }}
              className="aspect-square rounded-xl" iconSize={28}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm">{l.name}</p>
            <p className="text-sm font-medium">{formatZAR(l.price)}</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="inline-flex items-center rounded-full border border-line">
                <button aria-label="Decrease quantity" className="flex h-9 w-9 items-center justify-center" onClick={() => setQty(l.id, l.qty - 1)}><Minus size={16} /></button>
                <span className="w-6 text-center text-sm">{l.qty}</span>
                <button aria-label="Increase quantity" className="flex h-9 w-9 items-center justify-center disabled:opacity-30" disabled={l.qty >= l.max} onClick={() => setQty(l.id, l.qty + 1)}><Plus size={16} /></button>
              </div>
              <button aria-label="Remove item" className="p-2 text-muted" onClick={() => remove(l.id)}><Trash2 size={18} /></button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartTotals({ lines }: { lines: CartLine[] }) {
  const subtotal = cartSubtotal(lines);
  const shipping = shippingFor(subtotal);
  const away = STORE.freeShippingOver - subtotal;
  return (
    <div className="space-y-2 text-sm">
      {subtotal > 0 && away > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs text-muted">You&apos;re {formatZAR(away)} away from free delivery</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, (subtotal / STORE.freeShippingOver) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatZAR(subtotal)}</span></div>
      <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{shipping === 0 ? "Free" : formatZAR(shipping)}</span></div>
      <div className="flex justify-between border-t border-line pt-2 text-base font-medium"><span>Total</span><span>{formatZAR(subtotal + shipping)}</span></div>
      <p className="text-xs text-muted">Prices include VAT where applicable.</p>
    </div>
  );
}
