import { NextResponse } from "next/server";
import { z } from "zod";
import { PROVINCES, shippingFor } from "@/lib/config";
import { sendOrderEmails } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const schema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(10) })).min(1).max(20),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(7).max(30),
  }),
  address: z.object({
    street: z.string().trim().min(3).max(200),
    suburb: z.string().trim().max(100).default(""),
    city: z.string().trim().min(2).max(100),
    province: z.enum(PROVINCES),
    postal_code: z.string().trim().regex(/^\d{4}$/),
  }),
  notes: z.string().trim().max(500).default(""),
  payment_method: z.enum(["eft", "payment_link"]),
  accepted: z.literal(true),
});

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Please check your details and try again.");
  const d = parsed.data;
  const sb = createServiceClient();

  const qty = new Map<string, number>();
  d.items.forEach((i) => qty.set(i.id, Math.min(10, (qty.get(i.id) ?? 0) + i.qty)));
  const ids = [...qty.keys()];

  const { data: rows, error } = await sb.from("products").select("id,name,price_zar,status,stock_count,checkout_url").in("id", ids);
  if (error || !rows || rows.length !== ids.length) return fail("Some items in your bag are no longer available.", 409);

  let subtotal = 0;
  for (const r of rows) {
    const q = qty.get(r.id)!;
    if (r.status !== "Active" || r.stock_count < q) return fail(`${r.name} isn't available in the quantity you chose.`, 409);
    subtotal += Number(r.price_zar) * q;
  }
  const shipping = shippingFor(subtotal);

  let linkUrl: string | null = null;
  if (d.payment_method === "payment_link") {
    // One product with its own link: use it. Otherwise use the store-wide link from Settings.
    const own = rows.length === 1 ? (rows[0].checkout_url as string | null) : null;
    if (own) linkUrl = own;
    else {
      const { data: bd } = await sb.from("bank_details").select("payment_link_url").eq("is_active", true)
        .not("payment_link_url", "is", null).limit(1).maybeSingle();
      linkUrl = bd?.payment_link_url ?? null;
    }
    if (!linkUrl) return fail("A payment link isn't available for these items. Please choose EFT or order via WhatsApp.");
  }

  const { data, error: rpcError } = await sb.rpc("create_store_order", {
    p_customer_name: d.customer.name,
    p_customer_email: d.customer.email,
    p_customer_phone: d.customer.phone,
    p_shipping_address: d.address,
    p_payment_method: d.payment_method,
    p_payment_link_url: linkUrl,
    p_customer_notes: d.notes || null,
    p_items: [...qty].map(([product_id, quantity]) => ({ product_id, quantity })),
    p_shipping_zar: shipping,
    p_customer_user_id: null,
  });
  if (rpcError || !data) return fail(`We couldn't place your order. ${rpcError?.message ?? ""}`.trim(), 409);

  await sb.from("orders").update({ terms_accepted_at: new Date().toISOString() }).eq("order_reference", data.order_reference);

  await sendOrderEmails({
    reference: data.order_reference, name: d.customer.name, email: d.customer.email,
    total: Number(data.total_zar), method: d.payment_method,
  }).catch(() => undefined);

  return NextResponse.json({ reference: data.order_reference, paymentUrl: linkUrl });
}