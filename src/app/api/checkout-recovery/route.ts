import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  visitor_id: z.string().min(8).max(80),
  session_id: z.string().min(8).max(80),
  contact_email: z.string().trim().email().max(200).optional(),
  contact_phone: z.string().trim().min(7).max(30).optional(),
  customer_name: z.string().trim().max(120).optional(),
  checkout_path: z.string().max(500).default("/checkout"),
  cart_snapshot: z.array(z.object({ id: z.string().max(100), name: z.string().max(200).optional(), quantity: z.number().int().min(1).max(100).optional(), price: z.number().nonnegative().optional() })).max(30).default([]),
  cart_total_zar: z.number().nonnegative().optional(),
  affiliate_code: z.string().max(40).optional(),
  marketing_consent: z.literal(true),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Valid contact details and marketing consent are required." }, { status: 400 });
  const d = parsed.data;
  if (!d.contact_email && !d.contact_phone) return NextResponse.json({ error: "Provide an email or phone number." }, { status: 400 });
  const sb = createServiceClient();
  const { error } = await sb.from("store_abandoned_checkouts").upsert({
    visitor_id: d.visitor_id, session_id: d.session_id,
    contact_email: d.contact_email ?? null, contact_phone: d.contact_phone ?? null,
    customer_name: d.customer_name ?? null, checkout_path: d.checkout_path,
    cart_snapshot: d.cart_snapshot, cart_total_zar: d.cart_total_zar ?? null,
    affiliate_code: d.affiliate_code ?? null, marketing_consent: true,
    status: "open", last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }, { onConflict: "session_id" });
  if (error) return NextResponse.json({ error: "Recovery details could not be saved." }, { status: 503 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
