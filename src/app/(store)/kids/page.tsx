import Link from "next/link";
import { ChevronDown } from "lucide-react";
import KidsCard from "@/components/store/KidsCard";
import { getProducts } from "@/lib/catalog";
import { AGE_BANDS, KIDS_COLORS, inBand } from "@/lib/kids";
import { cn } from "@/lib/utils";

export const revalidate = 30;
export const metadata = { title: "Crolina Kids", description: "Everyday essentials for little ones." };

const PAGE_SIZE = 12;
const PASTELS = ["#ffe9a0", "#ffc9dd", "#c9f0d8", "#dcd2ff", "#ffd9b8", "#cfe6ff"];
const PRICES = [
  { v: "u200", l: "Under R200", test: (n: number) => n < 200 },
  { v: "200-500", l: "R200 – R500", test: (n: number) => n >= 200 && n <= 500 },
  { v: "o500", l: "Over R500", test: (n: number) => n > 500 },
];
type SP = { age?: string; category?: string; price?: string; sale?: string; page?: string };

function pagesToShow(page: number, total: number) {
  const list = [...new Set([1, total, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  list.forEach((n, i) => { if (i > 0 && n - list[i - 1] > 1) out.push("gap"); out.push(n); });
  return out;
}

export default async function Kids({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = await getProducts({ kids: "only" });
  const band = AGE_BANDS.find((b) => b.key === sp.age);
  const priceRule = PRICES.find((x) => x.v === sp.price);
  const filtering = Boolean(band || sp.category || priceRule || sp.sale === "1");

  const names = [...new Set(all.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
  const cats = names.map((name) => ({ name, image: all.find((p) => p.category === name && p.image_urls[0])?.image_urls[0] ?? null }));

  const list = all.filter((p) =>
    (!band || inBand(p, band)) && (!sp.category || p.category === sp.category) &&
    (!priceRule || priceRule.test(p.price_zar)) &&
    (sp.sale !== "1" || (p.compare_at_price_zar != null && p.compare_at_price_zar > p.price_zar)));
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, parseInt(sp.page ?? "1", 10) || 1));
  const products = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const href = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    Object.entries({ ...sp, ...over }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/kids${s ? `?${s}` : ""}#products`;
  };
  const box = "flex h-11 min-w-11 items-center justify-center rounded-xl border-2 border-[#d6e8ff] bg-white px-3 text-sm";
  const opt = (key: keyof SP, value: string, label: string) => (
    <Link key={value} href={href({ [key]: sp[key] === value ? undefined : value, page: undefined })}
      className={cn("block rounded-lg px-3 py-2.5 text-sm", sp[key] === value && "bg-[#e6f1ff] font-medium")}>{label}</Link>
  );
  function Dropdown({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
    return (
      <details className="relative">
        <summary className={cn("chip-kids cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden", active && "chip-kids-active")}>{label} <ChevronDown size={14} /></summary>
        <div className="absolute left-0 top-full z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border-2 border-[#d6e8ff] bg-white p-1.5 shadow-lg">{children}</div>
      </details>
    );
  }

  return (
    <div className="kids-bg -mx-4 -mt-5 space-y-8 px-4 pb-10 pt-5">
      <section className="relative overflow-hidden rounded-[1.75rem] px-6 py-7 text-white" style={{ background: KIDS_COLORS.blue }}>
        <span className="absolute -right-5 -top-6 h-24 w-24 rounded-full" style={{ background: KIDS_COLORS.yellow }} aria-hidden="true" />
        <span className="absolute bottom-[-14px] right-16 h-12 w-12 rounded-full bg-[#ff8fb8]" aria-hidden="true" />
        <span className="absolute bottom-12 right-5 h-8 w-8 rounded-full bg-[#6fe08f]" aria-hidden="true" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.08em]">Crolina</p>
        <h1 className="font-kids relative mt-1 text-5xl font-semibold leading-none">Kids</h1>
        <p className="relative mt-3 max-w-[14rem] text-sm">Everyday essentials for little ones.</p>
        <a href="#products" className="btn btn-kids-yellow relative mt-5 w-36">Shop now</a>
      </section>

      <section>
        <h2 className="font-kids mb-3 text-2xl font-semibold">Shop by age</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {AGE_BANDS.map((b) => (
            <Link key={b.key} href={href({ age: b.key, page: undefined })} className="flex h-24 flex-col items-center justify-center rounded-3xl text-white" style={{ background: b.color }}>
              <span className="font-kids text-3xl font-semibold leading-none">{b.label}</span>
              <span className="text-xs">years</span>
            </Link>
          ))}
        </div>
      </section>

      {cats.length > 0 && (
        <section>
          <h2 className="font-kids mb-3 text-2xl font-semibold">Shop by category</h2>
          <div className="grid grid-cols-3 gap-4 text-center text-xs font-medium md:grid-cols-6">
            {cats.map((c, i) => (
              <Link key={c.name} href={href({ category: c.name, page: undefined })}>
                <div className="mx-auto aspect-square w-full max-w-[5.5rem] overflow-hidden rounded-full" style={{ background: PASTELS[i % PASTELS.length] }}>
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-2 line-clamp-2">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Dropdown label="Age" active={!!band}>{AGE_BANDS.map((b) => opt("age", b.key, `${b.label} years`))}</Dropdown>
        {cats.length > 0 && <Dropdown label="Category" active={!!sp.category}>{cats.map((c) => opt("category", c.name, c.name))}</Dropdown>}
        <Dropdown label="Price" active={!!priceRule}>{PRICES.map((x) => opt("price", x.v, x.l))}</Dropdown>
        <Link href={href({ sale: sp.sale === "1" ? undefined : "1", page: undefined })} className={cn("chip-kids", sp.sale === "1" && "chip-kids-active")}>On sale</Link>
        {filtering && <Link href="/kids#products" className="chip-kids border-transparent bg-transparent text-muted underline">Clear</Link>}
      </div>

      <section id="products" className="scroll-mt-24">
        <h2 className="font-kids mb-3 text-2xl font-semibold">{filtering ? `Results (${list.length})` : "Best sellers"}</h2>
        {all.length === 0 ? (
          <div className="card-kids px-6 py-14 text-center">
            <p className="font-kids text-xl font-semibold">Crolina Kids is coming soon</p>
            <p className="mt-1 text-sm text-muted">New products for little ones will appear here as soon as they are added.</p>
            <Link href="/shop" className="btn btn-kids mt-5 px-8">Browse the shop</Link>
          </div>
        ) : products.length === 0 ? (
          <div className="card-kids px-6 py-14 text-center">
            <p className="font-medium">No products found</p>
            <Link href="/kids#products" className="btn btn-kids mt-5 px-8">Clear filters</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{products.map((p) => <KidsCard key={p.id} p={p} />)}</div>
        )}
      </section>

      {products.length > 0 && (
        <nav aria-label="Pages" className="space-y-3">
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pagesToShow(page, totalPages).map((n, i) =>
                n === "gap" ? <span key={`g${i}`} className="px-1 text-muted">…</span> : (
                  <Link key={n} href={href({ page: n > 1 ? String(n) : undefined })} aria-current={n === page ? "page" : undefined}
                    className={cn(box, n === page && "border-[#1170d8] bg-[#1170d8] text-white")}>{n}</Link>
                ))}
            </div>
          )}
          <p className="text-center text-sm text-muted">Page {page} of {totalPages}</p>
        </nav>
      )}

      <section className="grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="rounded-2xl bg-[#fff1b8] px-2 py-3"><b className="block text-xs">Age on every product</b>Clear age guidance</div>
        <div className="rounded-2xl bg-[#c9f0d8] px-2 py-3"><b className="block text-xs">1–5 business days</b>Nationwide delivery</div>
        <div className="rounded-2xl bg-[#ffd3e3] px-2 py-3"><b className="block text-xs">Return requests</b>Handled by email</div>
      </section>
    </div>
  );
}
