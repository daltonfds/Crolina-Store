import type { MetadataRoute } from "next";
import { STORE } from "@/lib/config";
import { getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: STORE.url, changeFrequency: "daily", priority: 1 },
    { url: `${STORE.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...products.map((p) => ({ url: `${STORE.url}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
