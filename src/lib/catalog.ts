import { createAnonClient } from "@/lib/supabase/service";
import { PRODUCT_COLUMNS, toProduct, type Product } from "@/lib/types";

const VISIBLE = ["Active", "Out of Stock"];

export async function getProducts(opts: {
  q?: string; category?: string; sort?: string; featured?: boolean; limit?: number; excludeId?: string;
} = {}): Promise<Product[]> {
  let q = createAnonClient().from("products").select(PRODUCT_COLUMNS).in("status", VISIBLE);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.featured) q = q.eq("featured", true);
  if (opts.excludeId) q = q.neq("id", opts.excludeId);
  if (opts.q) {
    const t = opts.q.replace(/[%,()\\*]/g, " ").trim().slice(0, 60);
    if (t) q = q.or(`name.ilike.%${t}%,description.ilike.%${t}%,category.ilike.%${t}%`);
  }
  if (opts.sort === "price-asc") q = q.order("price_zar", { ascending: true });
  else if (opts.sort === "price-desc") q = q.order("price_zar", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) { console.error("getProducts:", error.message); return []; }
  return (data ?? []).map(toProduct);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const { data } = await createAnonClient()
    .from("products").select(PRODUCT_COLUMNS).eq("slug", slug).in("status", VISIBLE).maybeSingle();
  return data ? toProduct(data) : null;
}

export async function getCategories(): Promise<string[]> {
  const { data } = await createAnonClient().from("products").select("category").in("status", VISIBLE);
  return [...new Set((data ?? []).map((r) => r.category as string))].sort();
}
