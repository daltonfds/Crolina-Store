import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

const categories = ["Kindles", "Smartwatches", "Power Banks", "TWS Earphones", "Mini UPS"] as const;
type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price_zar: number | string;
  condition: string;
  description: string;
  image_urls: string[] | null;
  stock_count: number;
};

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const normalized = category.toLowerCase().replace(/-/g, " ");
  const title = categories.find((item) => item.toLowerCase() === normalized);
  if (!title) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) notFound();

  const db = createClient(url, key);
  const { data, error } = await db
    .from("products")
    .select("id,name,slug,category,price_zar,condition,description,image_urls,stock_count")
    .eq("category", title)
    .eq("status", "Active")
    .gt("stock_count", 0)
    .order("created_at", { ascending: false });

  if (error) console.error("Could not load category products:", error.message);
  const products = (data ?? []) as Product[];

  return (
    <main className="container section">
      <Link href="/" className="back">← Back to shop</Link>
      <p className="eyebrow">Crolina Shop · South Africa</p>
      <h1>{title}</h1>
      {products.length === 0 ? (
        <p className="muted">There are no products listed in this category right now.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <article className="product" key={product.id}>
              <Link href={`/products/${product.slug}`} className="product-image">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} loading="lazy" />
                ) : (
                  <span className="pdp-placeholder">CROLINA SHOP</span>
                )}
              </Link>
              <div className="product-body">
                <small>{product.condition}</small>
                <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                <p>{product.description}</p>
                <strong>{Number(product.price_zar).toLocaleString("en-ZA", { style: "currency", currency: "ZAR" })}</strong>
                <Link className="button primary full" href={`/products/${product.slug}`}>View product</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
