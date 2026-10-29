import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { RETURN_ELIGIBLE_ORDER_STATUSES, OPEN_STATUSES, type ReturnRow } from "@/lib/returns";

export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
export const ORDER_REF = /^CR-[A-F0-9]{10}$/;
export const RETURN_REF = /^RT-[A-F0-9]{8}$/;
export const NOT_FOUND = "We could not find an order with those details. Check the reference and the email used at checkout.";

/** The order matches only when both the reference and the checkout email match. */
export async function findOrder(reference: string, email: string) {
  const sb = createServiceClient();
  const ref = reference.trim().toUpperCase();
  if (!ORDER_REF.test(ref) || !/^\S+@\S+\.\S+$/.test(email.trim())) return null;
  const { data: order } = await sb.from("orders")
    .select("id,order_reference,status,customer_name,customer_email,customer_phone,shipping_address,created_at")
    .eq("order_reference", ref).maybeSingle();
  if (!order || String(order.customer_email).toLowerCase() !== email.trim().toLowerCase()) return null;
  const { data: items } = await sb.from("order_items").select("id,product_name,quantity").eq("order_id", order.id);
  const { data: open } = await sb.from("return_requests").select("reference,status").eq("order_id", order.id).in("status", OPEN_STATUSES).limit(1);
  return {
    order, items: items ?? [],
    eligible: (RETURN_ELIGIBLE_ORDER_STATUSES as readonly string[]).includes(order.status),
    openRequest: open?.[0]?.reference ?? null,
  };
}

export async function loadReturn(reference: string, token: string): Promise<ReturnRow | null> {
  if (!RETURN_REF.test(reference) || token.length < 32) return null;
  const { data } = await createServiceClient().from("return_requests").select("*").eq("reference", reference).maybeSingle();
  if (!data || data.access_token !== token) return null;
  return data as ReturnRow;
}

export async function addEvent(returnId: string, status: string, message: string | null, actor: string, emailed = false) {
  await createServiceClient().from("return_events").insert({ return_id: returnId, status, message, actor, emailed });
}
