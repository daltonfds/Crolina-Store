import Link from "next/link";
import { Search } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { getCategories, getProducts } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const revalidate = 30;
export const metadata = { title: "Shop" };

type SP = { q?: string; category?: string; sort?: string; search?: string; sale?: string };

const SORTS = [
  { v: "", l: "Newest" },
  { v: "price-asc", l: "Price: low to high" },
  { v: "price-desc", l: "Price: high to low" },
];

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const [products, categories] = await Promise.all([
    getProducts({ q, category: sp.category, sort: sp.sort, onSale: sp.sale === "1" }),
    getCategories(),
  ]);
  const href = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const m = { q, category: sp.category, sort: sp.sort, sale: sp.sale, ...over };
    Object.entries(m).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/shop?${s}` : "/shop";
  };
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-medium">Shop</h1>
          <p className="text-sm text-muted">{products.length} {products.length === 1 ? "product" : "products"}</p>
        </div>
      </div>

      <form action="/shop" className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} autoFocus={sp.search === "1"} placeholder="Search products" className="field pl-11" />
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={href({ category: undefined })} className={cn("chip", !sp.category && "chip-active")}>All</Link>
        {categories.map((c) => (
          <Link key={c} href={href({ category: c })} className={cn("chip", sp.category === c && "chip-active")}>{c}</Link>
        ))}
        <Link href="/supplements" className="chip">Wellness</Link>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {SORTS.map((s) => (
          <Link key={s.v} href={href({ sort: s.v || undefined })} className={cn("rounded-full px-3 py-1", (sp.sort ?? "") === s.v ? "bg-surface font-medium" : "text-muted")}>{s.l}</Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-medium">No products found</p>
          <p className="mt-1 text-sm text-muted">Try a different search or category.</p>
          <Link href="/shop" className="btn btn-outline mt-5">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
