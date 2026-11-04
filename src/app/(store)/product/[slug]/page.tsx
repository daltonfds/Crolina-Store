import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import AddToCart from "@/components/store/AddToCart";
import HelpsList from "@/components/store/HelpsList";
import PaymentMethodLogos from "@/components/store/PaymentMethodLogos";
import ProductCard from "@/components/store/ProductCard";
import ProductGallery from "@/components/store/ProductGallery";
import StickyBuy from "@/components/store/StickyBuy";
import { getProduct, getProducts } from "@/lib/catalog";
import KidsCard from "@/components/store/KidsCard";
import SupplementCard from "@/components/store/SupplementCard";
import { ageLabel, KIDS_COLORS } from "@/lib/kids";
import { STORE, isSupplement, whatsappUrl } from "@/lib/config";
import { formatZAR } from "@/lib/money";
import { isSoldOut } from "@/lib/types";
import { TINTS } from "@/lib/utils";

export const revalidate = 30;

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
  const kids = p.is_kids;
  const related = kids
    ? (await getProducts({ kids: "only", excludeId: p.id, limit: 8 }))
        .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category)).slice(0, 4)
    : await getProducts({ category: p.category, excludeId: p.id, limit: 4, includeSupplements: isSupplement(p.category) });
  const sold = isSoldOut(p);
  const onSale = !!p.compare_at_price_zar && p.compare_at_price_zar > p.price_zar;
  const saving = onSale ? p.compare_at_price_zar! - p.price_zar : 0;
  const wa = whatsappUrl(`Hi Crolina, I'm interested in: ${p.name}`);
  const specs = Object.entries(p.specs);
  const highlights = ([["Condition", p.condition], ...specs] as [string, string][]).slice(0, 4);
  const badge = sold ? undefined : p.stock_count === 1 ? "Single item" : onSale ? "Sale" : p.featured ? "Best seller" : undefined;
  const low = !sold && p.stock_count <= STORE.lowStock;
  const supp = isSupplement(p.category);
  const age = kids ? ageLabel(p) : null;

  return (
    <div className="space-y-12">
      <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 md:gap-10">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductGallery
            product={{ id: p.id, name: p.name, category: p.category, image_urls: p.image_urls }}
            badge={kids && age ? age : badge}
            dots={supp}
          />
        </div>

        <div className="min-w-0">
          <Link href={`${kids ? "/kids" : "/shop"}?category=${encodeURIComponent(p.category)}`} className="inline-block max-w-full rounded-full bg-surface px-3 py-1 text-xs text-muted">{supp && p.brand ? `${p.brand} · ` : ""}{p.category}</Link>
          <h1 className={`mt-2 break-words text-xl font-medium leading-snug sm:text-2xl md:text-3xl ${kids ? "font-kids font-semibold" : ""}`}>{p.name}</h1>

          {supp && p.tagline && <p className="mt-2 text-sm italic text-ink/70">{p.tagline}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-2xl font-medium" style={kids ? { color: KIDS_COLORS.coral } : undefined}>{formatZAR(p.price_zar)}</span>
            {onSale && <span className="text-sm font-medium text-red-600 line-through">{formatZAR(p.compare_at_price_zar!)}</span>}
            {onSale && <span className="rounded-full bg-soft-green px-3 py-1 text-xs font-medium text-deep-green">Save {formatZAR(saving)}</span>}
          </div>
          {(supp || kids) && (p.pack_size || p.flavour) && (
            <div className="mt-4 space-y-3">
              {p.pack_size && <div><p className="mb-1.5 text-xs text-muted">Size</p><span className="inline-block rounded-full border border-ink px-4 py-2 text-sm font-medium">{p.pack_size}</span></div>}
              {p.flavour && <div><p className="mb-1.5 text-xs text-muted">Flavour</p><span className="inline-block rounded-full border border-ink px-4 py-2 text-sm font-medium">{p.flavour}</span></div>}
            </div>
          )}
          <p className={`mt-1 text-sm ${sold ? "text-danger" : low ? "text-deep-sand" : "text-deep-green"}`}>
            {sold ? "Sold out" : low ? `Only ${p.stock_count} left in stock` : "In stock"}
          </p>

          {supp && p.benefits && <HelpsList text={p.benefits} />}

          {kids && (
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Recommended age", value: age ?? "See pack", bg: "#cfe6ff" },
                { label: "Made of", value: p.material, bg: "#ffe9a0" },
                { label: "Condition", value: p.condition, bg: "#c9f0d8" },
              ].filter((t) => t.value).map((t) => (
                <div key={t.label} className="rounded-2xl px-2 py-2.5" style={{ background: t.bg }}>
                  <p className="font-kids line-clamp-2 text-base font-semibold leading-tight">{t.value}</p>
                  <p className="mt-0.5 text-[11px] text-ink/70">{t.label}</p>
                </div>
              ))}
            </div>
          )}

          {!kids && highlights.length > 0 && !(supp && p.benefits) && (
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

          <div id="buy-box" className="mt-6"><AddToCart product={p} supplement={supp} kids={kids} /></div>
          {supp && <div className="mt-1"><PaymentMethodLogos /></div>}
          {supp && <p className="mt-3 text-center text-xs text-muted">Original product · Expiry date on pack · Free delivery in up to 3 business days</p>}
          {kids && (
            <div className="mt-5 rounded-2xl bg-[#fff1b8] px-4 py-3.5">
              <h2 className="font-kids text-lg font-semibold">Safety information</h2>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {age ? `Recommended age: ${age.replace("Ages ", "").replace("Age ", "")}. ` : ""}
                {p.safety_info || "Check the age and warnings printed on the pack. Adult supervision is recommended."}
              </p>
            </div>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-muted underline">Have a question? Ask us on WhatsApp</a>
          )}

          <nav aria-label="Shopping information" className="mt-6 divide-y divide-line border-y border-line">
            {[
              { Icon: Truck, title: "Delivery options", href: "/delivery" },
              { Icon: RotateCcw, title: "Returns & warranty", href: "/returns" },
              { Icon: ShieldCheck, title: "Payment information", href: "/terms" },
              { Icon: MessageCircle, title: "WhatsApp support", href: wa || "/terms", external: !!wa },
            ].map(({ Icon, title, href, external }) => {
              const content = <span className="flex items-center gap-3 py-4 text-sm font-medium"><Icon size={19} strokeWidth={1.6} className="text-deep-blue" /><span>{title}</span><span className="ml-auto text-muted" aria-hidden="true">↗</span></span>;
              return external
                ? <a key={title} href={href} target="_blank" rel="noreferrer" className="block">{content}</a>
                : <Link key={title} href={href} className="block">{content}</Link>;
            })}
          </nav>

          <div className="mt-6 border-t border-line">
            {p.description && <Accordion title="Description"><p className="whitespace-pre-line">{p.description}</p></Accordion>}
            {kids && p.box_contents && <Accordion title="What is in the box"><p className="whitespace-pre-line">{p.box_contents}</p></Accordion>}
            {kids && p.care_info && <Accordion title="Care & materials"><p className="whitespace-pre-line">{p.care_info}</p></Accordion>}
            {specs.length > 0 && (
              <Accordion title="Details">
                <dl className="divide-y divide-line">
                  {specs.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted">{k}</dt><dd className="text-right text-ink">{v}</dd></div>
                  ))}
                </dl>
              </Accordion>
            )}
            {supp && p.ingredients && <Accordion title="Supplement facts"><p className="whitespace-pre-line">{p.ingredients}</p></Accordion>}
            {supp && p.how_to_use && <Accordion title="How to use"><p className="whitespace-pre-line">{p.how_to_use}</p></Accordion>}
            {supp && (
              <Accordion title="Warnings">
                <p className="whitespace-pre-line">{p.warnings || "Adults 18+ only. Does not replace a varied diet. Keep out of reach of children. Ask a health professional if you are pregnant, breastfeeding or on medication."}</p>
              </Accordion>
            )}
            <Accordion title="Delivery information">
              {supp ? <p>Supplements include free nationwide delivery in up to 3 business days after payment is confirmed.</p> : <><p>Express delivery takes 1–3 business days and costs R150. Standard delivery takes 1–5 business days and costs R100.</p><p className="mt-2">Get free delivery when your order contains 5 or more eligible items OR your product subtotal is R2,500 or more after discounts.</p></>}
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
          <h2 className="mb-3 text-base font-medium">{kids ? "More for this age" : supp ? "Goes well with" : "You may also like"}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{related.map((r) => (kids ? <KidsCard key={r.id} p={r} /> : supp ? <SupplementCard key={r.id} p={r} /> : <ProductCard key={r.id} p={r} />))}</div>
        </section>
      )}

      <StickyBuy product={p} />
    </div>
  );
}