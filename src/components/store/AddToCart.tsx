"use client";
import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { WhatsAppIcon } from "./SocialLinks";
import { STORE, whatsappUrl } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { formatZAR } from "@/lib/money";
import { lineTotal } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AddToCart({ product, supplement = false }: { product: Product; supplement?: boolean }) {
  const add = useCart((s) => s.add);
  const max = Math.max(1, Math.min(product.stock_count, 10));
  const [qty, setQty] = useState(1);
  const sold = isSoldOut(product);
  const tiers = { b3: product.bundle3_pct, b6: product.bundle6_pct };
  const total = lineTotal(product.price_zar, qty, tiers);
  const options = [1, ...(tiers.b3 ? [3] : []), ...(tiers.b6 ? [6] : [])];
  const showBundles = supplement && options.length > 1 && !sold;
  const msg =
    `Hi Crolina! I'd like to buy this item:\n\n*${product.name}*\n` +
    `Price: ${formatZAR(product.price_zar)}\nQuantity: ${qty}\n` +
    `Total: ${formatZAR(total)} (delivery not included)\n` +
    `Link: ${STORE.url}/product/${product.slug}\n\nPlease confirm availability and payment details.`;
  const wa = whatsappUrl(msg);
  return (
    <div className="space-y-3">
      {showBundles && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-semibold uppercase tracking-wide">Buy more &amp; save</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className={cn("grid gap-2", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {options.map((n) => {
              const saving = product.price_zar * n - lineTotal(product.price_zar, n, tiers);
              const on = qty === n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={n > max}
                  onClick={() => setQty(n)}
                  aria-pressed={on}
                  className={cn("relative overflow-hidden rounded-xl border bg-white px-2 pb-3 pt-7 text-center text-sm font-semibold disabled:opacity-40", on ? "border-2 border-ink" : "border-line")}
                >
                  {saving > 0 && <span className="absolute inset-x-0 top-0 bg-ink py-1 text-[10px] font-medium uppercase text-white">Save {formatZAR(saving)}</span>}
                  <span className={cn("mx-auto mb-2 block h-4 w-4 rounded-full border-2 border-ink", on && "bg-ink ring-2 ring-inset ring-white")} />
                  {n} {n === 1 ? "unit" : "units"}
                </button>
              );
            })}
          </div>
          {qty > 1 && <p className="mt-2 text-center text-xs text-muted">Total for {qty} units: <span className="font-medium text-ink">{formatZAR(total)}</span></p>}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className={cn("inline-flex items-center border border-line", supplement ? "rounded-lg" : "rounded-full")}>
          <button aria-label="Decrease quantity" disabled={sold} className="flex h-12 w-11 items-center justify-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={18} /></button>
          <span className="w-6 text-center">{qty}</span>
          <button aria-label="Increase quantity" disabled={sold || qty >= max} className="flex h-12 w-11 items-center justify-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(max, q + 1))}><Plus size={18} /></button>
        </div>
        <button
          className={cn("btn btn-primary flex-1", supplement && "rounded-lg uppercase tracking-wide")}
          disabled={sold}
          onClick={() =>
            add({ id: product.id, slug: product.slug, name: product.name, category: product.category, price: product.price_zar, image: product.image_urls[0] ?? null, max: product.stock_count, link: product.checkout_url, b3: product.bundle3_pct, b6: product.bundle6_pct }, qty)
          }
        >
          {sold ? "Sold out" : supplement ? <><ShoppingCart size={18} /> Add to cart</> : "Add to bag"}
        </button>
      </div>
      {wa && !sold && (
        <a href={wa} target="_blank" rel="noreferrer" className={cn("btn btn-outline w-full", supplement && "rounded-lg")}>
          <WhatsAppIcon size={20} className="text-[#1fa855]" /> Buy via WhatsApp
        </a>
      )}
    </div>
  );
}