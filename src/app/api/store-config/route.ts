import { createServiceClient } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const db=createServiceClient();
    const {data,error}=await db.from("bank_details").select("label,account_name,bank_name,account_number,branch_code,payment_link_url,mpesa_instructions,emola_instructions,eft_instructions").eq("is_active",true).limit(1).maybeSingle();
    if(error) throw error;
    return Response.json({payment:data??null},{headers:{"Cache-Control":"no-store"}});
  } catch(e) { console.error(e); return Response.json({payment:null},{status:200,headers:{"Cache-Control":"no-store"}}); }
}
