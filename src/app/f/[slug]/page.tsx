import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FunnelChat from "@/components/banca/FunnelChat";
import { createAnonClient } from "@/lib/supabase/service";
import { mergeProduct, type FunnelConfig, type Product } from "@/lib/banca";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const { data } = await createAnonClient()
    .from("banca_funnels")
    .select("config, product:banca_products(name,kind,price,old_price,benefits,images)")
    .eq("slug", slug).eq("published", true).maybeSingle();
  if (!data) return null;
  const product = (Array.isArray(data.product) ? data.product[0] : data.product) as Product | null;
  return mergeProduct(data.config as FunnelConfig, product);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await load((await params).slug);
  return { title: { absolute: c?.brand ?? "Funil" }, robots: { index: false, follow: false } };
}

export default async function FunnelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await load(slug);
  if (!config) notFound();
  return <FunnelChat config={config} slug={slug} />;
}
