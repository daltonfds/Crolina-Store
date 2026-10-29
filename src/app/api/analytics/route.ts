import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
const schema = z.object({
  visitor_id: z.string().min(8).max(80),
  session_id: z.string().min(8).max(80),
  event_type: z.enum(["page_view", "product_view", "add_to_cart", "checkout_started", "checkout_completed", "order_placed", "cookie_accepted", "exit_prompt_opened"]),
  path: z.string().trim().min(1).max(500),
  page_title: z.string().trim().max(200).optional(),
  product_id: z.string().max(100).optional(),
  product_name: z.string().trim().max(200).optional(),
  referrer: z.string().trim().max(500).optional(),
  duration_seconds: z.number().int().min(0).max(86400).optional(),
  contact_email: z.string().trim().email().max(200).optional(),
  contact_phone: z.string().trim().max(30).optional(),
  consent_marketing: z.boolean().optional(),
  affiliate_code: z.string().trim().max(40).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const d = parsed.data;
  const { error } = await createServiceClient().from("store_visitor_events").insert({
    ...d,
    metadata: d.metadata ?? {},
  });
  if (error) return NextResponse.json({ error: "Analytics temporarily unavailable" }, { status: 503 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
