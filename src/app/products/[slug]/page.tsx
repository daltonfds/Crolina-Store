import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MessageCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import ProductGallery from "@/components/product-gallery";
export const revalidate=60;
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)notFound();
 const db=createClient(url,key);
 const {data:p}=await db.from("products").select("id,name,slug,category,price_zar,condition,description,specs,image_urls,stock_count").eq("slug",slug).eq("status","Active").gt("stock_count",0).maybeSingle();
 if(!p)notFound();
 const price=Number(p.price_zar).toLocaleString("en-ZA",{style:"currency",currency:"ZAR"});
 const base=process.env.NEXT_PUBLIC_STORE_URL||"https://www.crolina.shop";
 const whatsapp=(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"").replace(/[^0-9]/g,"");
 const waText=encodeURIComponent(`Hi Crolina Shop, I am interested in ${p.name}. Price: ${price}. Condition: ${p.condition}. Product link: ${base}/products/${p.slug}`);
 const specs=p.specs&&typeof p.specs==="object"?Object.entries(p.specs as Record<string,unknown>):[];
 return <main className="container" style={{padding:"36px 0 70px"}}><Link href="/" className="back"><ArrowLeft size={16}/> Back to shop</Link><div className="pdp-grid"><ProductGallery images={Array.isArray(p.image_urls)?p.image_urls:[]} name={p.name}/><div><p className="eyebrow">{p.category}</p><h1 className="pdp-title">{p.name}</h1><p className="condition">{p.condition}</p><p className="pdp-price">{price}</p><p className="pdp-description">{p.description}</p><p className="stock">{p.stock_count} in stock · South Africa delivery</p><div className="pdp-actions"><Link className="button primary" href={`/checkout?product=${p.id}`}><ShoppingBag size={17}/> Buy now</Link>{whatsapp&&<a className="button secondary" href={`https://wa.me/${whatsapp}?text=${waText}`} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Buy via WhatsApp</a>}</div>{specs.length>0&&<section className="specs"><h2>Specifications</h2>{specs.map(([k,v])=><div key={k} className="spec-row"><strong>{k.replaceAll("_"," ")}</strong><span>{Array.isArray(v)?v.join(", "):String(v)}</span></div>)}</section>}<p className="pdp-note">Product specifications are based on supplier information and should be confirmed for the exact unit before payment.</p></div></div></main>;
}
