import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const reference = String(form?.get("reference") ?? "").toUpperCase();
  const file = form?.get("file");
  if (!/^CR-[A-F0-9]{10}$/.test(reference) || !(file instanceof File)) return fail("Invalid upload.", 400);
  if (file.size > 4 * 1024 * 1024) return fail("File is too large (max 4 MB).", 413);
  const ext = TYPES[file.type];
  if (!ext) return fail("Please upload a JPG, PNG, WebP or PDF file.", 415);

  const sb = createServiceClient();
  const { data: order } = await sb.from("orders").select("id,status,order_reference").eq("order_reference", reference).maybeSingle();
  if (!order) return fail("Order not found.", 404);
  if (!["pending_payment", "proof_submitted"].includes(order.status)) return fail("This order no longer accepts proof of payment.", 409);

  const path = `${order.id}/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("payment-proofs").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return fail("Upload failed. Please try again.", 500);

  await sb.from("orders").update({
    payment_proof_path: path, payment_proof_uploaded_at: new Date().toISOString(), status: "proof_submitted",
  }).eq("id", order.id);

  await sendEmail(process.env.STORE_ALERT_EMAIL || "", `Proof of payment for ${reference}`,
    `<p>A customer uploaded proof of payment for order <b>${reference}</b>.</p>`).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
