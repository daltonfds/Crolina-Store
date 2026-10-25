import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/store/AddToCart";
import ProductCard from "@/components/store/ProductCard";
import ProductThumb from "@/components/store/ProductThumb";
import { getProduct, getProducts } from "@/lib/catalog";
import { STORE, whatsappUrl } from "@/lib/config";
import { formatZAR } from "@/lib/money";
import { isSoldOut } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.description.slice(0, 160) || `${p.name} at ${STORE.name}`,
    openGraph: { images: p.image_urls[0] ? [p.image_urls[0]] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const related = await getProducts({ category: p.category, excludeId: p.id, limit: 4 });
  const sold = isSoldOut(p);
  const onSale = p.compare_at_price_zar && p.compare_at_price_zar > p.price_zar;
  const wa = whatsappUrl(`Hi Crolina, I'm interested in: ${p.name}`);
  const specs = Object.entries(p.specs);
  return (
    <div className="space-y-12">
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="-mx-4 flex snap-x snap-mandatory overflow-x-auto md:mx-0 md:rounded-2xl">
          {(p.image_urls.length ? p.image_urls : [null]).map((url, i) => (
            <div key={i} className="w-full shrink-0 snap-center">
              <ProductThumb
                product={{ id: p.id, name: p.name, category: p.category, image_urls: url ? [url] : [] }}
                className="aspect-square md:rounded-2xl" iconSize={72}
              />
            </div>
          ))}
        </div>
        <div>
          <Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="text-sm text-muted">{p.category}</Link>
          <h1 className="mt-1 text-2xl font-medium md:text-3xl">{p.name}</h1>
          <p className="mt-2 text-xl font-medium">
            {formatZAR(p.price_zar)}
            {onSale && <span className="ml-3 text-sm font-normal text-muted line-through">{formatZAR(p.compare_at_price_zar!)}</span>}
          </p>
          <p className={`mt-1 text-sm ${sold ? "text-danger" : p.stock_count <= STORE.lowStock ? "text-deep-sand" : "text-deep-green"}`}>
            {sold ? "Sold out" : p.stock_count <= STORE.lowStock ? `Only ${p.stock_count} left` : "In stock"}
          </p>
          {p.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">{p.description}</p>}
          {specs.length > 0 && (
            <dl className="mt-4 divide-y divide-line rounded-2xl border border-line text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>
              ))}
            </dl>
          )}
          <div className="mt-6"><AddToCart product={p} /></div>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-muted underline">Ask a question on WhatsApp</a>}
          <div className="mt-6 divide-y divide-line border-y border-line text-sm">
            <details className="py-3"><summary className="cursor-pointer font-medium">Delivery</summary><p className="mt-2 text-muted">Delivered across South Africa. Free over R {STORE.freeShippingOver}, otherwise a flat R {STORE.shippingFlat}. We confirm timing after payment.</p></details>
            <details className="py-3"><summary className="cursor-pointer font-medium">Returns &amp; warranty</summary><p className="mt-2 text-muted">7 days for incorrect, damaged or faulty items, subject to assessment and applicable law.</p></details>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-medium">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
