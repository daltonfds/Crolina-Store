import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function GET() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key) return Response.json({error:"Catalogue unavailable"},{status:503});
  const db=createClient(url,key);
  const {data,error}=await db.from("products").select("id,name,slug,category,price_zar,condition,description,specs,image_urls,stock_count").eq("status","Active").gt("stock_count",0).order("created_at",{ascending:false});
  if(error){console.error(error);return Response.json({error:"Could not load catalogue"},{status:500});}
  return Response.json({products:data},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}});
}
