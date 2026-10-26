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
      <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 md:gap-10">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductGallery
            product={{ id: p.id, name: p.name, category: p.category, image_urls: p.image_urls }}
            badge={badge}
          />
        </div>

        <div className="min-w-0">
          <Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="inline-block max-w-full rounded-full bg-surface px-3 py-1 text-xs text-muted">{p.category}</Link>
          <h1 className="mt-2 break-words text-xl font-medium leading-snug sm:text-2xl md:text-3xl">{p.name}</h1>

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

          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl border border-line p-3 text-center sm:grid-cols-4 sm:gap-2 sm:p-3">
            {[
              { Icon: Truck, t: "Delivery options", s: "From R100 · See details" },
              { Icon: RotateCcw, t: "7-day returns", s: "See policy" },
              { Icon: ShieldCheck, t: "Safe payment", s: "EFT or link" },
              { Icon: MessageCircle, t: "Support", s: "WhatsApp" },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="flex min-w-0 flex-col items-center gap-1 px-1">
                <Icon size={20} strokeWidth={1.5} className="text-deep-blue" />
                <p className="text-xs font-medium leading-tight sm:text-[11px]">{t}</p>
                <p className="text-[11px] leading-tight text-muted sm:text-[10px]">{s}</p>
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
            <Accordion title="Delivery information">
              <p>Choose Standard Delivery (R100, estimated 1–5 business days) or Express Delivery (R150, estimated 1–3 business days).</p>
              <p className="mt-2">Get free delivery when your order contains 5 or more eligible items OR your product subtotal is R2,500 or more after discounts.</p>
              <p className="mt-2"><Link href="/delivery" className="font-medium underline">View delivery options and conditions</Link></p>
            </Accordion>
            <Accordion title="Returns & warranty">
              <p>Returns, cancellations, defective goods and refunds are handled in accordance with applicable South African consumer protection law.</p>
              <p className="mt-2"><Link href="/returns" className="underline">Read the full Returns &amp; Refunds Policy</Link></p>
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