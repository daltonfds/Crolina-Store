import Link from "next/link";
import HeroCards from "@/components/store/HeroCards";
import ProductCard from "@/components/store/ProductCard";
import { getCategories, getProducts } from "@/lib/catalog";

export const revalidate = 60;

export default async function Home() {
  const [featured, categories] = await Promise.all([getProducts({ featured: true, limit: 8 }), getCategories()]);
  const products = featured.length ? featured : await getProducts({ limit: 8 });
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[#f4f8ff] p-3 sm:p-5 md:p-8">
        <HeroCards />
      </section>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/shop" className="chip chip-active">All</Link>
        {categories.map((c) => (
          <Link key={c} href={`/shop?category=${encodeURIComponent(c)}`} className="chip">{c}</Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-medium">Best sellers</h2>
          {products.length > 0 && <Link href="/shop" className="text-sm text-muted underline">View all</Link>}
        </div>
        {products.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="text-lg font-medium">The collection is coming together</p>
            <p className="mt-1 text-sm text-muted">New products will appear here as soon as they&apos;re added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      <Link href="/kids" className="relative block overflow-hidden rounded-3xl bg-[#1170d8] px-5 py-5 text-white">
        <span className="absolute -right-4 -top-6 h-20 w-20 rounded-full bg-[#ffd93b]" aria-hidden="true" />
        <span className="absolute bottom-[-12px] right-24 h-9 w-9 rounded-full bg-[#ff8fb8]" aria-hidden="true" />
        <span className="relative block text-[11px] font-semibold uppercase tracking-[0.08em]">New</span>
        <span className="font-kids relative block text-3xl font-semibold leading-tight">Crolina Kids</span>
        <span className="relative mt-1 block max-w-[13rem] text-sm">Everyday essentials for little ones.</span>
        <span className="btn btn-kids-yellow relative mt-3 h-10 px-5 text-sm">Shop Kids</span>
      </Link>
    </div>
  );
}