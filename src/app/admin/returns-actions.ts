"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { emailReturnUpdate } from "@/lib/return-emails";
import { MESSAGE_REQUIRED, NEXT_STATUSES, RETURN_STATUSES, type ReturnRow, type ReturnStatus } from "@/lib/returns";
import { addEvent } from "@/lib/returns-server";
import { createServiceClient } from "@/lib/supabase/service";

export async function updateReturn(fd: FormData) {
  const { user } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "") as ReturnStatus;
  const message = String(fd.get("message") ?? "").trim().slice(0, 3000);
  const refundRaw = String(fd.get("refund_amount") ?? "").trim();
  const sendEmail = fd.get("send_email") === "on";
  const back = `/admin/returns/${id}`;
  const fail = (e: string) => redirect(`${back}?error=${encodeURIComponent(e)}`);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !RETURN_STATUSES.some((s) => s.value === status)) return fail("Invalid update.");
  const sb = createServiceClient();
  const { data } = await sb.from("return_requests").select("*").eq("id", id).maybeSingle();
  if (!data) return fail("Request not found.");
  const r = data as ReturnRow;
  if (!NEXT_STATUSES[r.status].includes(status)) return fail("That status change is not allowed from the current status.");
  if (MESSAGE_REQUIRED.includes(status) && message.length < 5) return fail("Write a message for the customer.");
  let refund: number | null = r.refund_amount_zar;
  if (refundRaw !== "") {
    refund = Number(refundRaw);
    if (!Number.isFinite(refund) || refund < 0 || refund > 100000) return fail("Enter a valid refund amount.");
  }
  if (status === "completed" && r.request_type === "refund" && refund == null) return fail("Enter the refund amount before completing a refund.");
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status, updated_at: now, refund_amount_zar: refund };
  if (message) patch.admin_message = message;
  if (["approved", "rejected"].includes(status)) patch.decided_at = now;
  if (status === "received") patch.received_at = now;
  if (status === "completed") patch.completed_at = now;
  const { data: updated, error } = await sb.from("return_requests").update(patch).eq("id", id).eq("status", r.status).select("*").single();
  if (error || !updated) return fail("Could not save. Reload and try again.");
  let emailed = false;
  if (sendEmail) emailed = await emailReturnUpdate(updated as ReturnRow, message);
  await addEvent(id, status, message || null, user.email ?? "admin", emailed);
  revalidatePath("/admin/returns");
  redirect(`${back}?saved=${emailed ? "emailed" : sendEmail ? "noemail" : "1"}`);
}
