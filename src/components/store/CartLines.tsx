"use client";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import ProductThumb from "./ProductThumb";
import { STORE, isSupplement, qualifiesForFreeShipping, shippingFor, type DeliveryMethod } from "@/lib/config";
import { cartCount, cartSubtotal, useCart, type CartLine } from "@/lib/cart";
import { formatZAR } from "@/lib/money";
import { tierPct, unitPriceFor } from "@/lib/pricing";

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
            <p className="text-sm font-medium">
              {formatZAR(unitPriceFor(l.price, l.qty, { b3: l.b3, b6: l.b6 }))}
              {tierPct(l.qty, { b3: l.b3, b6: l.b6 }) > 0 && <span className="ml-2 text-xs font-normal text-muted">bundle price</span>}
            </p>
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

export function CartTotals({ lines, deliveryMethod = "standard" }: { lines: CartLine[]; deliveryMethod?: DeliveryMethod }) {
  const subtotal = cartSubtotal(lines);
  const itemCount = cartCount(lines);
  const supplementsOnly = lines.length > 0 && lines.every((line) => isSupplement(line.category ?? ""));
  const freeDelivery = supplementsOnly || qualifiesForFreeShipping(subtotal, itemCount);
  const shipping = supplementsOnly ? 0 : shippingFor(subtotal, itemCount, deliveryMethod);
  const away = Math.max(0, STORE.freeShippingOver - subtotal);
  const itemsAway = Math.max(0, STORE.freeShippingMinItems - itemCount);
  return (
    <div className="space-y-2 text-sm">
      {subtotal > 0 && !freeDelivery && (
        <div className="mb-3 rounded-xl bg-[#f0f7ff] p-3">
          <p className="text-xs text-[#1e4f9c]">
            {itemsAway > 0
              ? `Add ${itemsAway} more ${itemsAway === 1 ? "item" : "items"} OR spend ${formatZAR(away)} more to unlock free delivery.`
              : `Your order qualifies for free delivery.`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#8ab7ed]" style={{ width: `${Math.min(100, (subtotal / STORE.freeShippingOver) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="flex justify-between"><span className="text-muted">Subtotal (after discounts)</span><span>{formatZAR(subtotal)}</span></div>
      <div className="flex justify-between"><span className="text-muted">Delivery · {deliveryMethod === "express" ? "Express" : "Standard"}</span><span>{shipping === 0 ? "Free" : formatZAR(shipping)}</span></div>
      <div className="flex justify-between border-t border-line pt-2 text-base font-medium"><span>Total</span><span>{formatZAR(subtotal + shipping)}</span></div>
      <p className="text-xs text-muted">{supplementsOnly ? "Supplements include free delivery in up to 3 business days." : "Free delivery applies to 5 or more eligible items OR a product subtotal of R2,500 or more after discounts."}</p>
      <p className="text-xs text-muted">Prices include VAT where applicable.</p>
    </div>
  );
}
