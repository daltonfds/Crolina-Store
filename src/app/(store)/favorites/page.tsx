"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { useFavs, useMounted } from "@/lib/cart";
import { createClient } from "@/lib/supabase/browser";
import { PRODUCT_COLUMNS, toProduct, type Product } from "@/lib/types";

export default function Favorites() {
  const mounted = useMounted();
  const ids = useFavs((s) => s.ids);
  const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    if (!mounted) return;
    if (ids.length === 0) { setProducts([]); return; }
    createClient().from("products").select(PRODUCT_COLUMNS).in("id", ids).in("status", ["Active", "Out of Stock"])
      .then(({ data }) => setProducts((data ?? []).map(toProduct)));
  }, [mounted, ids]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium">Favorites</h1>
      {products === null ? null : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Heart size={40} strokeWidth={1.25} className="text-muted" />
          <p className="text-sm text-muted">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn btn-primary">Browse the shop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
