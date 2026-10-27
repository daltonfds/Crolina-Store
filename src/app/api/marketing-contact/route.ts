import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
const schema = z.object({
  name: z.string().trim().max(120).optional().default("Store visitor"),
  email: z.string().trim().email().max(200),
  whatsapp: z.string().trim().max(30).optional().default(""),
  source: z.enum(["cookie_consent", "exit_prompt", "checkout"]).default("exit_prompt"),
  marketing_consent: z.boolean().default(false),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  const d = parsed.data;
  const consentedAt = d.marketing_consent ? new Date().toISOString() : null;
  const { error } = await createServiceClient().from("store_marketing_contacts").upsert({
    name: d.name || "Store visitor",
    email: d.email.toLowerCase(),
    whatsapp: d.whatsapp || null,
    source: d.source,
    marketing_consent: d.marketing_consent,
    consented_at: consentedAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: "We couldn't save your details. Please try again." }, { status: 503 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
