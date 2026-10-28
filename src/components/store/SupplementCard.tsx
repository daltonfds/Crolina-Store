"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import ProductThumb from "./ProductThumb";
import { useCart, useFavs, useMounted } from "@/lib/cart";
import { formatZAR } from "@/lib/money";
import { isSoldOut, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SupplementCard({ p }: { p: Product }) {
  const mounted = useMounted();
  const faved = useFavs((s) => s.ids.includes(p.id));
  const toggle = useFavs((s) => s.toggle);
  const add = useCart((s) => s.add);
  const sold = isSoldOut(p);
  const onSale = !!p.compare_at_price_zar && p.compare_at_price_zar > p.price_zar;
  return (
    <div className="relative flex flex-col rounded-2xl border border-line bg-white p-2.5">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative">
          <ProductThumb product={p} className="aspect-square rounded-xl" />
          {sold && <span className="absolute inset-x-0 bottom-0 bg-white/85 py-1.5 text-center text-xs font-medium">Sold out</span>}
          {!sold && onSale && (
            <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-deep-pink">Save {formatZAR(p.compare_at_price_zar! - p.price_zar)}</span>
          )}
        </div>
        {p.brand && <p className="mt-3 line-clamp-1 text-xs text-muted">{p.brand}</p>}
        <p className={cn("line-clamp-2 min-h-[2.5rem] text-[15px] font-medium leading-5", !p.brand && "mt-3")}>{p.name}</p>
        {p.pack_size && <p className="line-clamp-1 text-xs text-muted">{p.pack_size}{p.flavour ? ` · ${p.flavour}` : ""}</p>}
        <p className="mt-1 text-base font-semibold">
          {formatZAR(p.price_zar)}
          {onSale && <span className="ml-2 text-xs font-medium text-red-600 line-through">{formatZAR(p.compare_at_price_zar!)}</span>}
        </p>
      </Link>
      <button
        type="button"
        disabled={sold}
        onClick={() => add({ id: p.id, slug: p.slug, name: p.name, price: p.price_zar, image: p.image_urls[0] ?? null, max: p.stock_count, link: p.checkout_url }, 1)}
        className="btn btn-primary mt-3 h-11 w-full text-sm"
      >
        {sold ? "Sold out" : "Add to cart"}
      </button>
      <button
        type="button"
        aria-label={faved ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggle(p.id)}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/70"
      >
        <Heart size={18} className={cn(mounted && faved && "fill-deep-pink text-deep-pink")} />
      </button>
    </div>
  );
}
