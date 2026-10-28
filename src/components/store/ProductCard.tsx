"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import ProductThumb from "./ProductThumb";
import { useFavs, useMounted } from "@/lib/cart";
import { formatZAR } from "@/lib/money";
import { isSoldOut, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProductCard({ p }: { p: Product }) {
  const mounted = useMounted();
  const faved = useFavs((s) => s.ids.includes(p.id));
  const toggle = useFavs((s) => s.toggle);
  const sold = isSoldOut(p);
  const onSale = p.compare_at_price_zar && p.compare_at_price_zar > p.price_zar;
  const singleItem = p.stock_count === 1 && !sold;
  return (
    <div className="relative">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative">
          <ProductThumb product={p} className="aspect-square rounded-2xl" />
          {singleItem && (
            <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">Single item</span>
          )}
          {sold && (
            <span className="absolute inset-x-0 bottom-0 bg-white/85 py-1.5 text-center text-xs font-medium">Sold out</span>
          )}
          {!sold && !singleItem && onSale && (
            <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-deep-pink">Save {formatZAR(p.compare_at_price_zar! - p.price_zar)}</span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm">{p.name}</p>
        <p className="text-sm font-medium">
          {formatZAR(p.price_zar)}
          {onSale && <span className="ml-2 text-xs font-medium text-red-600 line-through">{formatZAR(p.compare_at_price_zar!)}</span>}
        </p>
      </Link>
      <button
        type="button"
        aria-label={faved ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggle(p.id)}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/70"
      >
        <Heart size={18} className={cn(mounted && faved && "fill-deep-pink text-deep-pink")} />
      </button>
    </div>
  );
}
