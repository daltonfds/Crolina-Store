import { NextResponse } from "next/server";
import { emailReturnReceived } from "@/lib/return-emails";
import { PHOTO_TYPES, REASONS, RETURNS, type ReturnItem, type ReturnRow } from "@/lib/returns";
import { NOT_FOUND, addEvent, fail, findOrder } from "@/lib/returns-server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return fail("Invalid request.");
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const found = await findOrder(get("reference"), get("email"));
  if (!found) return fail(NOT_FOUND, 404);
  if (found.openRequest) return fail(`There is already an open request for this order (${found.openRequest}).`, 409);
  if (!found.eligible) return fail("This order is not eligible for a return request yet.", 409);

  const type = get("type");
  const reason = REASONS.find((r) => r.value === get("reason"));
  const details = get("details");
  if (!["refund", "exchange"].includes(type)) return fail("Choose return or exchange.");
  if (!reason) return fail("Choose a reason.");
  if (details.length < 10 || details.length > 1500) return fail("Please describe the problem in at least 10 characters.");
  if (get("consent") !== "1") return fail("Please confirm that you have read the returns policy.");
  const exchange = get("exchange_preference").slice(0, 300);
  if (type === "exchange" && exchange.length < 3) return fail("Tell us what you would like in exchange.");

  let picked: { id: string; quantity: number }[] = [];
  try { picked = JSON.parse(get("items")); } catch { /* handled below */ }
  const items: ReturnItem[] = [];
  for (const p of Array.isArray(picked) ? picked : []) {
    const row = found.items.find((i) => i.id === p.id);
    const q = Math.floor(Number(p.quantity));
    if (!row || !(q >= 1 && q <= row.quantity)) return fail("Invalid item selection.");
    if (items.some((i) => i.order_item_id === row.id)) return fail("Invalid item selection.");
    items.push({ order_item_id: row.id, product_name: row.product_name, quantity: q });
  }
  if (items.length === 0) return fail("Select at least one item.");

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > RETURNS.maxPhotos) return fail(`You can attach up to ${RETURNS.maxPhotos} photos.`);
  for (const f of files) {
    if (!PHOTO_TYPES[f.type]) return fail("Photos must be JPG, PNG, WebP or HEIC.", 415);
    if (f.size > RETURNS.maxPhotoBytes) return fail("Each photo must be 4 MB or smaller.", 413);
  }
  if (reason.photo && files.length === 0) return fail("Please attach at least one photo of the problem.");

  const sb = createServiceClient();
  const o = found.order;
  const { data: row, error } = await sb.from("return_requests").insert({
    order_id: o.id, order_reference: o.order_reference, customer_name: o.customer_name, customer_email: o.customer_email,
    customer_phone: o.customer_phone, request_type: type, reason: reason.value, details,
    exchange_preference: type === "exchange" ? exchange : null, items,
  }).select("*").single();
  if (error || !row) return fail("We could not save your request. Please try again.", 500);

  const paths: string[] = [];
  for (const [n, f] of files.entries()) {
    const path = `${row.id}/${Date.now()}-${n}.${PHOTO_TYPES[f.type]}`;
    const up = await sb.storage.from("return-photos").upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
    if (!up.error) paths.push(path);
  }
  if (paths.length) await sb.from("return_requests").update({ photo_paths: paths }).eq("id", row.id);
  const full = { ...row, photo_paths: paths } as ReturnRow;
  await addEvent(row.id, "submitted", null, "customer");
  await emailReturnReceived(full).catch(() => undefined);
  return NextResponse.json({ reference: row.reference, token: row.access_token });
}
