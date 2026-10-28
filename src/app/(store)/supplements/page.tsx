import Link from "next/link";
import { ChevronDown } from "lucide-react";
import SupplementCard from "@/components/store/SupplementCard";
import { getProducts } from "@/lib/catalog";
import { SUPPLEMENT_CATEGORIES } from "@/lib/config";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export const revalidate = 30;
export const metadata = { title: "Supplements" };

const PAGE_SIZE = 12;
type SP = { category?: string; brand?: string; size?: string; price?: string; sale?: string; sort?: string; page?: string };

const PRICES = [
  { v: "u200", l: "Under R200", test: (n: number) => n < 200 },
  { v: "200-500", l: "R200 – R500", test: (n: number) => n >= 200 && n <= 500 },
  { v: "o500", l: "Over R500", test: (n: number) => n > 500 },
];

function pagesToShow(page: number, total: number) {
  const list = [...new Set([1, total, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  list.forEach((n, i) => { if (i > 0 && n - list[i - 1] > 1) out.push("gap"); out.push(n); });
  return out;
}

export default async function Supplements({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = await getProducts({ categories: [...SUPPLEMENT_CATEGORIES], includeSupplements: true });

  const goals = SUPPLEMENT_CATEGORIES.map((name) => {
    const items = all.filter((p) => p.category === name);
    return { name, count: items.length, image: items.find((p) => p.image_urls[0])?.image_urls[0] ?? null };
  }).filter((g) => g.count > 0);
  const brands = [...new Set(all.map((p) => p.brand).filter((b): b is string => !!b))].sort();
  const sizes = [...new Set(all.map((p) => p.pack_size).filter((s): s is string => !!s))].sort();

  const priceRule = PRICES.find((x) => x.v === sp.price);
  const filtering = Boolean(sp.category || sp.brand || sp.size || priceRule || sp.sale === "1" || sp.sort);
  let list: Product[] = all.filter((p) =>
    (!sp.category || p.category === sp.category) &&
    (!sp.brand || p.brand === sp.brand) &&
    (!sp.size || p.pack_size === sp.size) &&
    (!priceRule || priceRule.test(p.price_zar)) &&
    (sp.sale !== "1" || (p.compare_at_price_zar != null && p.compare_at_price_zar > p.price_zar)));
  if (sp.sort === "price-asc") list = [...list].sort((a, b) => a.price_zar - b.price_zar);
  else if (sp.sort === "price-desc") list = [...list].sort((a, b) => b.price_zar - a.price_zar);
  else list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, parseInt(sp.page ?? "1", 10) || 1));
  const products = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const href = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    Object.entries({ ...sp, ...over }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/supplements${s ? `?${s}` : ""}#products`;
  };
  const box = "flex h-11 min-w-11 items-center justify-center rounded-lg border border-line px-3 text-sm";

  function Dropdown({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
    return (
      <details className="relative">
        <summary className={cn("chip cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden", active && "chip-active")}>
          {label} <ChevronDown size={14} />
        </summary>
        <div className="absolute left-0 top-full z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-lg">{children}</div>
      </details>
    );
  }
  const opt = (key: keyof SP, value: string, label: string) => (
    <Link key={value} href={href({ [key]: sp[key] === value ? undefined : value, page: undefined })}
      className={cn("block rounded-lg px-3 py-2.5 text-sm", sp[key] === value ? "bg-surface font-medium" : "")}>{label}</Link>
  );

  return (
    <div className="space-y-7">
      <section className="rounded-3xl bg-ink px-6 py-7 text-white">
        <p className="text-xs uppercase tracking-[0.08em] text-white/70">Supplements</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight">Fuel your routine</h1>
        <p className="mt-1.5 text-sm text-white/80">Free nationwide delivery in up to 3 business days.</p>
        <a href="#products" className="btn mt-5 w-40 bg-white text-ink">Shop now</a>
      </section>

      {goals.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-medium">Shop by goal</h2>
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            {goals.map((g) => (
              <Link key={g.name} href={href({ category: g.name, page: undefined })}>
                <div className="mx-auto aspect-square w-full max-w-[5.5rem] overflow-hidden rounded-full bg-surface">
                  {g.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image} alt={g.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-2 line-clamp-2">{g.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {brands.length > 0 && <Dropdown label="Brand" active={!!sp.brand}>{brands.map((b) => opt("brand", b, b))}</Dropdown>}
        <Dropdown label="Goal" active={!!sp.category}>{goals.map((g) => opt("category", g.name, g.name))}</Dropdown>
        {sizes.length > 0 && <Dropdown label="Size" active={!!sp.size}>{sizes.map((s) => opt("size", s, s))}</Dropdown>}
        <Dropdown label="Price" active={!!priceRule}>{PRICES.map((x) => opt("price", x.v, x.l))}</Dropdown>
        <Link href={href({ sale: sp.sale === "1" ? undefined : "1", page: undefined })} className={cn("chip", sp.sale === "1" && "chip-active")}>On sale</Link>
        {filtering && <Link href="/supplements#products" className="chip border-transparent text-muted underline">Clear</Link>}
      </div>

      <section id="products" className="scroll-mt-24">
        <h2 className="mb-3 text-xl font-medium">{filtering ? `Results (${list.length})` : "Best sellers"}</h2>
        {all.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="font-medium">Supplements will appear here as products are added.</p>
            <Link href="/shop" className="btn btn-outline mt-5">Browse the shop</Link>
          </div>
        ) : products.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="font-medium">No products found</p>
            <p className="mt-1 text-sm text-muted">Try a different filter.</p>
            <Link href="/supplements#products" className="btn btn-outline mt-5">Clear filters</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{products.map((p) => <SupplementCard key={p.id} p={p} />)}</div>
        )}
      </section>

      {products.length > 0 && (
        <nav aria-label="Pages" className="space-y-3">
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pagesToShow(page, totalPages).map((n, i) =>
                n === "gap" ? <span key={`g${i}`} className="px-1 text-muted">…</span> : (
                  <Link key={n} href={href({ page: n > 1 ? String(n) : undefined })} aria-current={n === page ? "page" : undefined} className={cn(box, n === page && "border-ink bg-ink text-white")}>{n}</Link>
                ))}
            </div>
          )}
          <p className="text-center text-sm text-muted">Page {page} of {totalPages}</p>
        </nav>
      )}
    </div>
  );
}
