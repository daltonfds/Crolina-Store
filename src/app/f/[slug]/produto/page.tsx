import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BancaProductPage from "@/components/banca/BancaProductPage";
import { createAnonClient } from "@/lib/supabase/service";
import { mergeProduct, type FunnelConfig, type Product } from "@/lib/banca";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const { data } = await createAnonClient()
    .from("banca_funnels")
    .select("config, product:banca_products(name,kind,price,old_price,benefits,images,testimonials)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!data) return null;
  const product = (Array.isArray(data.product) ? data.product[0] : data.product) as Product | null;
  if (!product) return null;
  return {
    config: mergeProduct(data.config as FunnelConfig, product),
    testimonials: product.testimonials ?? [],
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await load((await params).slug);
  return {
    title: result ? `${result.config.name} | ${result.config.brand}` : "Produto",
    description: result?.config.ben.slice(0, 2).join(" · "),
    robots: { index: false, follow: false },
  };
}

export default async function BancaProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await load(slug);
  if (!result) notFound();
  return <BancaProductPage config={result.config} slug={slug} testimonials={result.testimonials} />;
}
