import Link from "next/link";
import { Lock, RotateCcw, Truck } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { getCategories, getProducts } from "@/lib/catalog";
import { STORE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, categories] = await Promise.all([getProducts({ featured: true, limit: 8 }), getCategories()]);
  const products = featured.length ? featured : await getProducts({ limit: 8 });
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-soft-blue p-6 md:p-14">
        <p className="text-sm text-deep-blue">New collection</p>
        <h1 className="mt-1 text-2xl font-medium leading-tight md:text-5xl">Style for every day</h1>
        <p className="mt-2 max-w-md text-sm text-ink/70 md:text-base">Essential goods, thoughtfully selected and delivered across South Africa.</p>
        <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-full border border-deep-blue/30 bg-white/40 px-6 text-sm hover:bg-white/70">Shop collection</Link>
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

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { Icon: Truck, t: "Delivery across South Africa", d: `Free over R ${STORE.freeShippingOver}, otherwise a flat R ${STORE.shippingFlat}.` },
          { Icon: RotateCcw, t: "7-day returns", d: "For incorrect, damaged or faulty items, subject to assessment." },
          { Icon: Lock, t: "Order with confidence", d: "Pay by EFT and upload your proof. We confirm every order personally." },
        ].map(({ Icon, t, d }) => (
          <div key={t} className="card p-5">
            <Icon size={22} strokeWidth={1.5} className="text-deep-blue" />
            <h3 className="mt-3 text-sm font-medium">{t}</h3>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
