import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, ShoppingBag } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price_zar: number | string;
  description: string | null;
  image_urls: string[] | null;
  stock_count: number | null;
};

type SearchParams = Promise<{ category?: string; sort?: string; q?: string }>;

async function getProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key);
  const { data, error } = await db
    .from("products")
    .select("id,name,slug,category,price_zar,description,image_urls,stock_count")
    .eq("status", "Active")
    .gt("stock_count", 0)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Unable to load shop catalogue:", error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

function price(value: number | string) {
  return Number(value).toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const allProducts = await getProducts();
  const categories = [...new Set(allProducts.map((product) => product.category).filter(Boolean))].sort();
  const query = (params.q ?? "").trim().toLocaleLowerCase();
  const selectedCategory = params.category ?? "";
  let products = allProducts.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesQuery = !query || [product.name, product.category, product.description ?? ""].some((value) => value.toLocaleLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });
  if (params.sort === "price-asc") products = [...products].sort((a, b) => Number(a.price_zar) - Number(b.price_zar));
  if (params.sort === "price-desc") products = [...products].sort((a, b) => Number(b.price_zar) - Number(a.price_zar));
  if (params.sort === "name") products = [...products].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main>
      <Header />
      <section className="products-section storefront-section">
        <div className="container section">
          <div className="section-head storefront-heading">
            <div>
              <p className="eyebrow">Crolina Shop · South Africa</p>
              <h1 className="storefront-title">The collection</h1>
              <p className="storefront-subtitle">Thoughtful finds for your everyday life.</p>
            </div>
            <span className="storefront-count"><ShoppingBag size={17} /> {products.length} {products.length === 1 ? "product" : "products"}</span>
          </div>
          <form action="/shop" className="shop-filters">
            <label className="shop-search">Search the collection<input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Search products" /></label>
            <label>Category<select name="category" defaultValue={selectedCategory}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label>Sort by<select name="sort" defaultValue={params.sort ?? "newest"}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name</option></select></label>
            <button className="button primary" type="submit">Apply filters</button>
          </form>
          {products.length === 0 ? (
            <div className="empty storefront-empty">
              <ShoppingBag size={34} />
              <h2>{allProducts.length === 0 ? "The collection is coming together" : "No matching products"}</h2>
              <p>{allProducts.length === 0 ? "Products added by the store owner will appear here. No demo products are shown." : "Try another search or category to find what you’re looking for."}</p>
              {allProducts.length > 0 && <Link className="button secondary" href="/shop">Clear filters</Link>}
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article className="product" key={product.id}>
                  <Link href={`/products/${product.slug}`} className="product-image" aria-label={`View ${product.name}`}>
                    {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.name} loading="lazy" /> : <div className="storefront-placeholder"><ShoppingBag size={38} /><span>CROLINA SHOP</span></div>}
                  </Link>
                  <div className="product-body">
                    <small>{product.category}</small>
                    <h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2>
                    {product.description && <p>{product.description}</p>}
                    <strong>{price(product.price_zar)}</strong>
                    <Link className="button primary full" href={`/products/${product.slug}`}>View product <ArrowRight size={15} /></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
