import { NextResponse } from "next/server";
import { CUSTOMER_CAN_CANCEL } from "@/lib/returns";
import { addEvent, fail, loadReturn } from "@/lib/returns-server";
import { sendEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const r = await loadReturn(String(b?.reference ?? ""), String(b?.token ?? ""));
  if (!r) return fail("Request not found.", 404);
  if (!CUSTOMER_CAN_CANCEL.includes(r.status)) return fail("This request can no longer be cancelled online. Reply to our email.", 409);
  await createServiceClient().from("return_requests").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", r.id);
  await addEvent(r.id, "cancelled", "Cancelled by the customer.", "customer");
  await sendEmail(process.env.STORE_ALERT_EMAIL || "", `Return request ${r.reference} cancelled`, `<p>${r.customer_name} cancelled request <b>${r.reference}</b> (order ${r.order_reference}).</p>`).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
