"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import ProductThumb from "./ProductThumb";
import { useCart, useFavs, useMounted } from "@/lib/cart";
import { ageLabel, KIDS_COLORS, tagColor } from "@/lib/kids";
import { formatZAR } from "@/lib/money";
import { isSoldOut, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function KidsCard({ p }: { p: Product }) {
  const mounted = useMounted();
  const faved = useFavs((s) => s.ids.includes(p.id));
  const toggle = useFavs((s) => s.toggle);
  const add = useCart((s) => s.add);
  const sold = isSoldOut(p);
  const onSale = !!p.compare_at_price_zar && p.compare_at_price_zar > p.price_zar;
  const age = ageLabel(p);
  return (
    <div className="card-kids relative flex flex-col p-2.5">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative">
          <ProductThumb product={p} className="aspect-square rounded-2xl" />
          {age && <span className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: tagColor(p) }}>{age}</span>}
          {sold && <span className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-white/85 py-1.5 text-center text-xs font-medium">Sold out</span>}
        </div>
        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-5">{p.name}</p>
        <p className="mt-1 text-base font-semibold" style={{ color: KIDS_COLORS.coral }}>
          {formatZAR(p.price_zar)}
          {onSale && <span className="ml-2 text-xs font-medium text-muted line-through">{formatZAR(p.compare_at_price_zar!)}</span>}
        </p>
      </Link>
      <button
        type="button"
        disabled={sold}
        onClick={() => add({ id: p.id, slug: p.slug, name: p.name, category: p.category, price: p.price_zar, image: p.image_urls[0] ?? null, max: p.stock_count, link: p.checkout_url, b3: p.bundle3_pct, b6: p.bundle6_pct }, 1)}
        className="btn btn-kids mt-3 h-11 w-full text-sm"
      >
        {sold ? "Sold out" : "Add to cart"}
      </button>
      <button
        type="button"
        aria-label={faved ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggle(p.id)}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/80"
      >
        <Heart size={18} className={cn(mounted && faved && "fill-deep-pink text-deep-pink")} />
      </button>
    </div>
  );
}
