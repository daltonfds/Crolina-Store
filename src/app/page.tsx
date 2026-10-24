import { Truck, ShieldCheck, MessageCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price_zar: number | string;
  condition: string | null;
  description: string | null;
  image_urls: string[] | null;
  stock_count: number | null;
};

async function getProducts(): Promise<StoreProduct[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const db = createClient(url, key);
  const { data, error } = await db
    .from("products")
    .select("id,name,slug,category,price_zar,condition,description,image_urls,stock_count")
    .eq("status", "Active")
    .gt("stock_count", 0)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Unable to load storefront products:", error.message);
    return [];
  }
  return (data ?? []) as StoreProduct[];
}

function formatPrice(price: number | string) {
  return Number(price).toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

export default async function Home() {
  const products = await getProducts();
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^0-9]/g, "");
  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi Crolina Shop, what products are available?")}`
    : `mailto:support@crolina.shop?subject=${encodeURIComponent("Product availability")}`;

  return (
    <main>
      <Header />

      <section id="products" className="products-section storefront-section">
        <div className="container section">
          <div className="section-head storefront-heading">
            <div>
              <p className="eyebrow">Crolina Shop · South Africa</p>
              <h1 className="storefront-title">Style for every day</h1>
              <p className="storefront-subtitle">Discover the collection, thoughtfully selected for your everyday life.</p>
            </div>
            <span className="storefront-count"><ShoppingBag size={17} /> {products.length} {products.length === 1 ? "product" : "products"} available</span>
          </div>

          {products.length === 0 ? (
            <div className="empty storefront-empty">
              <ShoppingBag size={34} />
              <h2>The collection is coming together</h2>
              <p>We’re preparing our first collection. New products will appear here as soon as they’re added to the store.</p>
              <a className="button primary" href={whatsappHref} target={whatsapp ? "_blank" : undefined} rel={whatsapp ? "noreferrer" : undefined}>Contact Crolina Shop</a>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article className="product" key={product.id}>
                  <Link href={`/products/${product.slug}`} className="product-image" aria-label={`View ${product.name}`}>
                    {product.image_urls?.[0]
                      ? <img src={product.image_urls[0]} alt={product.name} loading="lazy" />
                      : <div className="storefront-placeholder"><ShoppingBag size={38} /><span>CROLINA SHOP</span></div>}
                  </Link>
                  <div className="product-body">
                    <small>{product.category}{product.condition ? ` · ${product.condition}` : ""}</small>
                    <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                    {product.description && <p>{product.description}</p>}
                    <strong>{formatPrice(product.price_zar)}</strong>
                    <p className="storefront-stock">{product.stock_count} in stock</p>
                    <Link className="button primary full" href={`/products/${product.slug}`}>View product <ArrowRight size={15} /></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && <section id="categories" className="container section">
        <div className="section-head">
          <div><p className="eyebrow">Explore the collection</p><h2>Shop by category</h2></div>
          <p>Browse products by their listed category.</p>
        </div>
        <div className="category-grid">
          {categories.map((title) => (
            <Link className="category" href={`/shop?category=${encodeURIComponent(title)}`} key={title}>
              <div className="icon"><ShoppingBag size={23} /></div>
              <h3>{title}</h3>
              <p>Explore products in this category.</p>
            </Link>
          ))}
        </div>
      </section>}

      <section className="hero storefront-hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">A considered collection</p>
            <h2>Style for every day.</h2>
            <p className="lead">Discover thoughtful finds for your everyday life. Browse the collection and find something that feels like you.</p>
            <div className="actions">
              <a className="button primary" href="#products">Explore products <ArrowRight size={17} /></a>
              <a className="button secondary" href="#categories">Browse categories</a>
            </div>
            <p className="trust">Thoughtfully selected　 ·　 Secure order support　 ·　 Prices in ZAR</p>
          </div>
          <div className="visual" aria-hidden="true">
            <div className="orb" />
            <div className="tiles">
              {["Everyday style", "Made for you", "The collection", "Find your favourite"].map((title) => (
                <div className="tile" key={title}><ShoppingBag size={30} /><b>{title.toUpperCase()}</b></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="help" className="container section benefit-grid">
        <div className="benefit"><Truck /><h3>South Africa delivery</h3><p>Delivery options and timing are confirmed before your order is finalised.</p></div>
        <div className="benefit"><ShieldCheck /><h3>7-day warranty</h3><p>Returns are considered for incorrect, damaged or broken items, subject to assessment and applicable law.</p></div>
        <div className="benefit"><MessageCircle /><h3>Real support</h3><p>Ask about availability, payment options and your order before purchasing.</p></div>
      </section>
      <Footer />
    </main>
  );
}
