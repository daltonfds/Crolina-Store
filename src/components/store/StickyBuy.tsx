"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatZAR } from "@/lib/money";
import { isSoldOut, type Product } from "@/lib/types";

export default function StickyBuy({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById("buy-box");
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!show || isSoldOut(product)) return null;
  return (
    <div className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-white/95 px-4 py-2.5 backdrop-blur md:bottom-0">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{product.name}</p>
          <p className="text-sm font-medium">{formatZAR(product.price_zar)}</p>
        </div>
        <button
          className="btn btn-primary !h-11 shrink-0"
          onClick={() =>
            add({ id: product.id, slug: product.slug, name: product.name, price: product.price_zar, image: product.image_urls[0] ?? null, max: product.stock_count, link: product.checkout_url, b3: product.bundle3_pct, b6: product.bundle6_pct }, 1)
          }
        >
          Add to bag
        </button>
      </div>
    </div>
  );
}