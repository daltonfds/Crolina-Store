import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeMz } from "@/lib/banca";

const schema = z.object({
  slug: z.string().min(3).max(40),
  name: z.string().trim().min(1).max(60),
  city: z.string().trim().max(80).optional(),
  phone: z.string().max(20).optional(),
  product: z.string().trim().max(120),
  price: z.number().min(0).max(10_000_000),
  answers: z.array(z.string().max(200)).max(8),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;
  const sb = createServiceClient();
  const { data: funnel } = await sb.from("banca_funnels").select("id").eq("slug", d.slug).eq("published", true).maybeSingle();
  if (!funnel) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { error } = await sb.from("banca_orders").insert({
    funnel_id: funnel.id, customer_name: d.name, city: d.city || null, phone: d.phone ? normalizeMz(d.phone) : null, product: d.product, price: d.price, answers: d.answers,
  });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
