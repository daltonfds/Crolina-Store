import { NextResponse } from "next/server";
import { emailReturnMethodChosen } from "@/lib/return-emails";
import { addEvent, fail, loadReturn } from "@/lib/returns-server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const r = await loadReturn(String(b?.reference ?? ""), String(b?.token ?? ""));
  if (!r) return fail("Request not found.", 404);
  if (r.status !== "approved") return fail("This request is not waiting for a return method.", 409);
  const method = b?.method;
  if (method !== "collection" && method !== "send_back") return fail("Choose a return method.");

  let address: Record<string, string> | null = null;
  if (method === "collection") {
    const a = b?.address ?? {};
    const pick = (k: string, max = 120) => String(a[k] ?? "").trim().slice(0, max);
    address = { street: pick("street", 200), suburb: pick("suburb"), city: pick("city"), province: pick("province"), postal_code: pick("postal_code", 10), phone: pick("phone", 30) };
    if (address.street.length < 3 || address.city.length < 2 || !/^\d{4}$/.test(address.postal_code) || address.phone.replace(/\D/g, "").length < 7)
      return fail("Please complete the collection address and a phone number.");
  }
  const sb = createServiceClient();
  const { data, error } = await sb.from("return_requests")
    .update({ return_method: method, collection_address: address, status: "awaiting_return", updated_at: new Date().toISOString() })
    .eq("id", r.id).eq("status", "approved").select("*").single();
  if (error || !data) return fail("Could not save your choice. Please try again.", 500);
  await addEvent(r.id, "awaiting_return", method === "collection" ? "Customer chose collection." : "Customer will send the item back.", "customer");
  await emailReturnMethodChosen(data as never).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
