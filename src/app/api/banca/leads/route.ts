import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeMz } from "@/lib/banca";

const schema = z.object({
  slug: z.string().min(3).max(40),
  name: z.string().trim().max(60).optional(),
  phone: z.string().max(20),
  answers: z.array(z.string().max(200)).max(8),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;
  const phone = normalizeMz(d.phone);
  if (!phone) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  const sb = createServiceClient();
  const { data: funnel } = await sb.from("banca_funnels").select("id").eq("slug", d.slug).eq("published", true).maybeSingle();
  if (!funnel) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { error } = await sb.from("banca_leads").upsert({ funnel_id: funnel.id, name: d.name || null, phone, answers: d.answers }, { onConflict: "funnel_id,phone" });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
