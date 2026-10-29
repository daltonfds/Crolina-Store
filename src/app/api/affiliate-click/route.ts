import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[a-z0-9_-]+$/i),
  visitor_id: z.string().min(8).max(80),
  session_id: z.string().min(8).max(80),
  landing_path: z.string().max(500).optional(),
  referrer: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid referral" }, { status: 400 });
  const d = parsed.data;
  const sb = createServiceClient();
  const { data: affiliate } = await sb.from("store_affiliates").select("id").eq("code", d.code.toLowerCase()).eq("status", "active").maybeSingle();
  if (affiliate) await sb.from("store_affiliate_clicks").insert({
    affiliate_id: affiliate.id, visitor_id: d.visitor_id, session_id: d.session_id,
    landing_path: d.landing_path ?? "/", referrer: d.referrer ?? null,
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
