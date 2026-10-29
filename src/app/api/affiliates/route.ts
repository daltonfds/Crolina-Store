import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your details." }, { status: 400 });
  const d = parsed.data;
  const sb = createServiceClient();
  const { data: existing } = await sb.from("store_affiliates").select("id").ilike("email", d.email).maybeSingle();
  if (existing) return NextResponse.json({ error: "An application with this email already exists." }, { status: 409 });
  const base = d.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "affiliate";
  const code = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  const { error } = await sb.from("store_affiliates").insert({ name: d.name, email: d.email, phone: d.phone || null, code, status: "pending" });
  if (error) return NextResponse.json({ error: "We couldn't submit your application right now." }, { status: 503 });
  return NextResponse.json({ ok: true, message: "Application received. The Crolina team will review it and contact you." }, { status: 201 });
}
