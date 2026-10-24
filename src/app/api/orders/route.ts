import { createServiceClient } from "@/lib/supabase-server";
import { sendOrderCreatedEmail } from "@/lib/email";
export const runtime="nodejs";
const methods=["payment_link","bank_transfer","eft","mpesa","emola"];
export async function POST(request:Request) {
  try {
    const body=await request.json();
    const name=String(body.name??"").trim(), email=String(body.email??"").trim().toLowerCase(), phone=String(body.phone??"").trim();
    if(name.length<2||name.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||phone.length<5||phone.length>40)
      return Response.json({error:"Enter a valid name, email and phone number."},{status:400});
    const a=body.address??{};
    const address={line1:String(a.line1??"").trim(),suburb:String(a.suburb??"").trim(),city:String(a.city??"").trim(),province:String(a.province??"").trim(),postal_code:String(a.postal_code??"").trim(),country:"South Africa"};
    if(!address.line1||!address.city||!address.province||!address.postal_code) return Response.json({error:"Complete your delivery address."},{status:400});
    if(!Array.isArray(body.items)||body.items.length<1||body.items.length>20) return Response.json({error:"Your cart is empty or too large."},{status:400});
    if(!methods.includes(body.payment_method)) return Response.json({error:"Select a valid payment method."},{status:400});
    const merged=new Map<string,number>();
    for(const item of body.items){const id=String(item.product_id??"");const qty=Number(item.quantity);if(!/^[0-9a-f-]{36}$/i.test(id)||!Number.isInteger(qty)||qty<1||qty>10)return Response.json({error:"Invalid cart item."},{status:400});merged.set(id,(merged.get(id)||0)+qty);}
    const items=[...merged].map(([product_id,quantity])=>({product_id,quantity}));
    if(items.some(x=>x.quantity>10))return Response.json({error:"Maximum 10 of each product per order."},{status:400});
    const db=createServiceClient();
    let customerUserId:string|null=null;
    const authorization=request.headers.get("authorization")||"";
    if(authorization.startsWith("Bearer ")){
      const {data:authData,error:authError}=await db.auth.getUser(authorization.slice(7));
      if(authError||!authData.user)return Response.json({error:"Your account session expired. Sign in again or continue as a guest."},{status:401});
      if((authData.user.email||"").toLowerCase()!==email)return Response.json({error:"Use the email address linked to your signed-in account, or sign out to check out as a guest."},{status:400});
      customerUserId=authData.user.id;
    }
    const {data:payment,error:paymentError}=await db.from("bank_details").select("payment_link_url").eq("is_active",true).limit(1).maybeSingle();
    if(paymentError)throw paymentError;
    const paymentLink=body.payment_method==="payment_link"?(String(body.payment_link_url||payment?.payment_link_url||"").trim()):null;
    if(body.payment_method==="payment_link"&&!/^https:\/\//i.test(paymentLink||""))return Response.json({error:"Online payment link is not configured. Choose bank transfer or another available method."},{status:400});
    const {data,error}=await db.rpc("create_store_order",{p_customer_name:name,p_customer_email:email,p_customer_phone:phone,p_shipping_address:address,p_payment_method:body.payment_method,p_payment_link_url:paymentLink,p_customer_notes:String(body.notes??"").slice(0,1000),p_items:items,p_shipping_zar:0,p_customer_user_id:customerUserId});
    if(error){console.error("Order RPC failed",error);return Response.json({error:error.message.includes("Insufficient stock")?"Some items are no longer available in the requested quantity.": "Could not create your order. Please check the cart and try again."},{status:400});}
    const order=data as {id:string;order_reference:string;total_zar:number|string;payment_method:string;payment_link_url:string|null;status:string};
    await sendOrderCreatedEmail({order_reference:order.order_reference,customer_name:name,customer_email:email,total_zar:order.total_zar,payment_method:order.payment_method,shipping_address:address}).catch(e=>console.error("Order email error",e));
    return Response.json({order:{...order,customer_email:email},payment_link_url:paymentLink},{status:201});
  } catch(e){console.error(e);return Response.json({error:"Unexpected checkout error. Please try again."},{status:500});}
}
