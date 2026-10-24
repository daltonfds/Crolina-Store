import { BookOpen, Watch, BatteryCharging, Headphones, Zap, Truck, ShieldCheck, MessageCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const categories = [
  { title: "Kindles", text: "Take your library anywhere", icon: BookOpen },
  { title: "Smartwatches", text: "Stay connected on the move", icon: Watch },
  { title: "Power Banks", text: "Reliable power wherever you go", icon: BatteryCharging },
  { title: "TWS Earphones", text: "Wireless sound for every day", icon: Headphones },
  { title: "Mini UPS", text: "Backup power for essentials", icon: Zap },
];

async function getProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select("id,name,description,price,category,image_url,stock_quantity,condition").eq("status", "Active").gt("stock_quantity", 0).order("created_at", { ascending: false }).limit(8);
  if (error) { console.error("Catalogue query failed:", error.message); return []; }
  return data ?? [];
}

export default async function Home() {
  const products = await getProducts();
  return <main>
    <div className="topbar">Thoughtful tech. Straightforward shopping. Delivery across South Africa.</div>
    <header className="header"><div className="container nav">
      <a className="logo" href="/">crolina<span>.</span></a>
      <nav><a href="#categories">Categories</a><a href="#products">Products</a><a href="#help">Help</a></nav>
      <a className="button primary" href="https://wa.me/?text=Hi%20Crolina%20Store%2C%20I%20have%20a%20question" target="_blank" rel="noreferrer">Chat to us <MessageCircle size={16}/></a>
    </div></header>
    <section className="hero"><div className="container hero-grid"><div>
      <p className="eyebrow">Crolina Store · South Africa</p><h1>Small upgrades.<br/>Better everyday.</h1>
      <p className="lead">Discover practical tech picked for the way you live, work and move — from portable power to personal audio and smart essentials.</p>
      <div className="actions"><a className="button primary" href="#products">Explore products <ArrowRight size={17}/></a><a className="button secondary" href="#categories">Browse categories</a></div>
      <p className="trust">✓ Clear product details　 ✓ Order support　 ✓ Prices in ZAR</p>
    </div><div className="visual"><div className="orb"/><div className="tiles">{categories.slice(0,4).map(({title,icon:Icon})=><div className="tile" key={title}><Icon size={34}/><b>{title.toUpperCase()}</b></div>)}</div></div></div></section>
    <section id="categories" className="container section"><div className="section-head"><div><p className="eyebrow">Find your next essential</p><h2>Shop by category</h2></div><p>Useful tech, thoughtfully selected.</p></div><div className="category-grid">{categories.map(({title,text,icon:Icon})=><a className="category" href="#products" key={title}><div className="icon"><Icon size={23}/></div><h3>{title}</h3><p>{text}</p></a>)}</div></section>
    <section id="products" className="products-section"><div className="container section"><p className="eyebrow">The everyday edit</p><h2>Featured products</h2>
      {products.length === 0 ? <div className="empty"><Zap size={30}/><h3>New arrivals are on the way</h3><p>Our catalogue is being prepared. Message us to ask about product availability.</p><a className="button primary" href="https://wa.me/?text=Hi%20Crolina%20Store%2C%20what%20products%20are%20available%3F" target="_blank" rel="noreferrer">Ask on WhatsApp</a></div> : <div className="product-grid">{products.map((p:any)=><article className="product" key={p.id}><div className="product-image">{p.image_url ? <img src={p.image_url} alt={p.name}/> : <Zap size={38}/>}</div><div className="product-body"><small>{p.category} · {p.condition}</small><h3>{p.name}</h3><p>{p.description}</p><strong>R {Number(p.price).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}</strong><a className="button primary full" href={"https://wa.me/?text="+encodeURIComponent("Hi Crolina Store, I am interested in "+p.name)} target="_blank" rel="noreferrer">Enquire on WhatsApp</a></div></article>)}</div>}
    </div></section>
    <section id="help" className="container section benefit-grid"><div className="benefit"><Truck/><h3>South Africa delivery</h3><p>Delivery options and timing are confirmed before your order is finalised.</p></div><div className="benefit"><ShieldCheck/><h3>7-day warranty</h3><p>Returns are considered for incorrect, damaged or broken items, subject to assessment and applicable law.</p></div><div className="benefit"><MessageCircle/><h3>Real support</h3><p>Ask about availability, payment options and your order before purchasing.</p></div></section>
    <footer><div className="container footer"><span>© {new Date().getFullYear()} Crolina Store</span><span>South Africa · ZAR</span><span><a href="/privacy">Privacy</a> · <a href="/returns">Returns & warranty</a> · <a href="/terms">Terms</a></span></div></footer>
  </main>;
}
