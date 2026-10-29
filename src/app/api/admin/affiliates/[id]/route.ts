import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({ status: z.enum(["active", "paused", "rejected", "pending"]) });

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data: admin } = await auth.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await createServiceClient().from("store_affiliates").update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq("id", id).select("id,status").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Affiliate could not be updated" }, { status: 404 });
  return NextResponse.json({ affiliate: data });
}
