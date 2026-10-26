"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { WhatsAppIcon } from "./SocialLinks";
import { STORE, whatsappUrl } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { formatZAR } from "@/lib/money";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const max = Math.max(1, Math.min(product.stock_count, 10));
  const [qty, setQty] = useState(1);
  const sold = isSoldOut(product);
  const msg =
    `Hi Crolina! I'd like to buy this item:\n\n*${product.name}*\n` +
    `Price: ${formatZAR(product.price_zar)}\nQuantity: ${qty}\n` +
    `Total: ${formatZAR(product.price_zar * qty)} (delivery not included)\n` +
    `Link: ${STORE.url}/product/${product.slug}\n\nPlease confirm availability and payment details.`;
  const wa = whatsappUrl(msg);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-line">
          <button aria-label="Decrease quantity" disabled={sold} className="flex h-12 w-11 items-center justify-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={18} /></button>
          <span className="w-6 text-center">{qty}</span>
          <button aria-label="Increase quantity" disabled={sold || qty >= max} className="flex h-12 w-11 items-center justify-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(max, q + 1))}><Plus size={18} /></button>
        </div>
        <button
          className="btn btn-primary flex-1"
          disabled={sold}
          onClick={() =>
            add({ id: product.id, slug: product.slug, name: product.name, price: product.price_zar, image: product.image_urls[0] ?? null, max: product.stock_count, link: product.checkout_url }, qty)
          }
        >
          {sold ? "Sold out" : "Add to bag"}
        </button>
      </div>
      {wa && !sold && (
        <a href={wa} target="_blank" rel="noreferrer" className="btn btn-outline w-full">
          <WhatsAppIcon size={20} className="text-[#1fa855]" /> Buy via WhatsApp
        </a>
      )}
    </div>
  );
}