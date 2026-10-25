"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const max = Math.max(1, Math.min(product.stock_count, 10));
  const [qty, setQty] = useState(1);
  const sold = isSoldOut(product);
  return (
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
          add({ id: product.id, slug: product.slug, name: product.name, price: product.price_zar, image: product.image_urls[0] ?? null, max: product.stock_count }, qty)
        }
      >
        {sold ? "Sold out" : "Add to bag"}
      </button>
    </div>
  );
}
