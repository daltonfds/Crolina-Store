import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import AddToCart from "@/components/store/AddToCart";
import ProductCard from "@/components/store/ProductCard";
import ProductGallery from "@/components/store/ProductGallery";
import StickyBuy from "@/components/store/StickyBuy";
import { getProduct, getProducts } from "@/lib/catalog";
import { STORE, whatsappUrl } from "@/lib/config";
import { formatZAR } from "@/lib/money";
import { isSoldOut } from "@/lib/types";
import { TINTS } from "@/lib/utils";

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

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line py-4" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <span className="relative h-4 w-4 shrink-0">
          <Plus size={16} className="absolute inset-0 group-open:hidden" />
          <Minus size={16} className="absolute inset-0 hidden group-open:block" />
        </span>
      </summary>
      <div className="pt-3 text-sm leading-relaxed text-ink/80">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const related = await getProducts({ category: p.category, excludeId: p.id, limit: 4 });
  const sold = isSoldOut(p);
  const onSale = !!p.compare_at_price_zar && p.compare_at_price_zar > p.price_zar;
  const saving = onSale ? p.compare_at_price_zar! - p.price_zar : 0;
  const wa = whatsappUrl(`Hi Crolina, I'm interested in: ${p.name}`);
  const specs = Object.entries(p.specs);
  const highlights = ([["Condition", p.condition], ...specs] as [string, string][]).slice(0, 4);
  const badge = sold ? undefined : onSale ? "Sale" : p.featured ? "Best seller" : undefined;
  const low = !sold && p.stock_count <= STORE.lowStock;

  return (
    <div className="space-y-12">
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductGallery
            product={{ id: p.id, name: p.name, category: p.category, image_urls: p.image_urls }}
            badge={badge}
          />
        </div>

        <div>
          <Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="inline-block rounded-full bg-surface px-3 py-1 text-xs text-muted">{p.category}</Link>
          <h1 className="mt-2 text-2xl font-medium leading-tight md:text-3xl">{p.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-2xl font-medium">{formatZAR(p.price_zar)}</span>
            {onSale && <span className="text-sm text-muted line-through">{formatZAR(p.compare_at_price_zar!)}</span>}
            {onSale && <span className="rounded-full bg-soft-green px-3 py-1 text-xs font-medium text-deep-green">Save {formatZAR(saving)}</span>}
          </div>
          <p className={`mt-1 text-sm ${sold ? "text-danger" : low ? "text-deep-sand" : "text-deep-green"}`}>
            {sold ? "Sold out" : low ? `Only ${p.stock_count} left in stock` : "In stock"}
          </p>

          {highlights.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {highlights.map(([label, value], i) => {
                const t = TINTS[i % TINTS.length];
                return (
                  <div key={label} className={`rounded-2xl px-3 py-2.5 ${t.bg}`}>
                    <p className={`text-[11px] ${t.fg}`}>{label}</p>
                    <p className="line-clamp-2 text-sm font-medium">{value}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div id="buy-box" className="mt-6"><AddToCart product={p} /></div>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-muted underline">Have a question? Ask us on WhatsApp</a>
          )}

          <div className="mt-6 grid grid-cols-4 gap-2 rounded-2xl border border-line p-3 text-center">
            {[
              { Icon: Truck, t: "Free delivery", s: `Over R ${STORE.freeShippingOver}` },
              { Icon: RotateCcw, t: "7-day returns", s: "See policy" },
              { Icon: ShieldCheck, t: "Safe payment", s: "EFT or link" },
              { Icon: MessageCircle, t: "Support", s: "WhatsApp" },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="flex flex-col items-center gap-1">
                <Icon size={20} strokeWidth={1.5} className="text-deep-blue" />
                <p className="text-[11px] font-medium leading-tight">{t}</p>
                <p className="text-[10px] leading-tight text-muted">{s}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-line">
            {p.description && <Accordion title="Description"><p className="whitespace-pre-line">{p.description}</p></Accordion>}
            {specs.length > 0 && (
              <Accordion title="Details">
                <dl className="divide-y divide-line">
                  {specs.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted">{k}</dt><dd className="text-right text-ink">{v}</dd></div>
                  ))}
                </dl>
              </Accordion>
            )}
            <Accordion title="Delivery">
              Delivered nationwide in {STORE.deliveryTime} after your payment is confirmed. Free over R {STORE.freeShippingOver}, otherwise a flat R {STORE.shippingFlat}.
            </Accordion>
            <Accordion title="Returns & warranty">
              <p>Report a problem or return an item within 7 days of delivery.</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Return: 50% of the price paid is refunded.</li>
                <li>Arrived damaged or destroyed: 50% of the price paid is refunded.</li>
                <li>Wrong item sent: we deduct the value of the item sent and the delivery fee, and refund the rest.</li>
              </ul>
              <p className="mt-2"><Link href="/returns" className="underline">Read the full policy</Link></p>
            </Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-medium">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}

      <StickyBuy product={p} />
    </div>
  );
}