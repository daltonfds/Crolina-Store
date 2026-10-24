import { createServiceClient } from "@/lib/supabase-server";
import { sendProofSubmittedEmail } from "@/lib/email";
export const runtime="nodejs";
export async function POST(request:Request) {
  try {
    const form=await request.formData();
    const reference=String(form.get("order_reference")||"").trim().toUpperCase();
    const email=String(form.get("email")||"").trim().toLowerCase();
    const file=form.get("proof");
    if(!/^CR-[A-F0-9]{10}$/.test(reference)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!(file instanceof File))
      return Response.json({error:"Enter the order reference and email, then select a receipt."},{status:400});
    if(file.size<1||file.size>5*1024*1024)return Response.json({error:"File must be 5MB or smaller."},{status:400});
    const allowed:Record<string,string>={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
    const ext=allowed[file.type];if(!ext)return Response.json({error:"Upload a PDF, JPG, PNG or WEBP file."},{status:400});
    const db=createServiceClient();
    const {data:order,error}=await db.from("orders").select("id,order_reference,customer_name,customer_email,total_zar,status,payment_proof_path").eq("order_reference",reference).eq("customer_email",email).maybeSingle();
    if(error||!order)return Response.json({error:"We could not match that reference and email."},{status:404});
    if(["paid","processing","shipped","completed","cancelled","refunded"].includes(order.status))return Response.json({error:"This order can no longer accept payment proof."},{status:409});
    if(order.payment_proof_path)return Response.json({error:"Payment proof has already been submitted for this order. Contact support if you need to replace it."},{status:409});
    const bytes=Buffer.from(await file.arrayBuffer());
    const isPdf=file.type==="application/pdf"&&bytes.subarray(0,5).toString()==="%PDF-";
    const isJpeg=file.type==="image/jpeg"&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
    const isPng=file.type==="image/png"&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const isWebp=file.type==="image/webp"&&bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP";
    if(!isPdf&&!isJpeg&&!isPng&&!isWebp)return Response.json({error:"The file content does not match its declared file type."},{status:400});
    const path=`${order.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await db.storage.from("payment-proofs").upload(path,bytes,{contentType:file.type,upsert:false});
    if(uploadError){console.error(uploadError);return Response.json({error:"Upload failed. Please retry."},{status:500});}
    const {error:updateError}=await db.from("orders").update({payment_proof_path:path,payment_proof_uploaded_at:new Date().toISOString(),status:"proof_submitted"}).eq("id",order.id);
    if(updateError){await db.storage.from("payment-proofs").remove([path]);throw updateError;}
    await sendProofSubmittedEmail(order).catch(e=>console.error("Proof email error",e));
    return Response.json({ok:true,message:"Payment proof received. We will verify it and email you with an update."});
  } catch(e){console.error(e);return Response.json({error:"Could not submit proof. Please try again."},{status:500});}
}
