import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formatZAR } from "@/lib/money";
import { createServiceClient } from "@/lib/supabase/service";
import { ORDER_STATUSES, statusMeta } from "@/lib/types";
import { updateOrderStatus } from "../../../actions";

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { sb } = await requireAdmin();
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: order }, { data: items }] = await Promise.all([
    sb.from("orders").select("*").eq("id", id).maybeSingle(),
    sb.from("order_items").select("product_name,unit_price_zar,quantity,line_total_zar").eq("order_id", id),
  ]);
  if (!order) notFound();
  let proofUrl: string | null = null;
  if (order.payment_proof_path) {
    const { data } = await createServiceClient().storage.from("payment-proofs").createSignedUrl(order.payment_proof_path, 300);
    proofUrl = data?.signedUrl ?? null;
  }
  const a = (order.shipping_address ?? {}) as Record<string, string>;
  const meta = statusMeta(order.status);
  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/admin/orders" className="text-sm text-muted">← All orders</Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-medium">{order.order_reference}</h1>
        <span className={`rounded-full px-3 py-1 text-xs ${meta.badge}`}>{meta.label}</span>
      </div>
      {(await searchParams).saved && <p className="rounded-xl bg-soft-green px-3 py-2 text-sm text-deep-green">Order updated.</p>}

      <form action={updateOrderStatus} className="card flex gap-2 p-4">
        <input type="hidden" name="id" value={order.id} />
        <select name="status" defaultValue={order.status} className="field">
          {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="btn btn-primary shrink-0">Update</button>
      </form>
      <p className="text-xs text-muted">Only mark an order Paid after the money has cleared in your bank. Cancelling an unpaid order puts the stock back.</p>

      <section className="card space-y-1 p-4 text-sm">
        <h2 className="mb-1 font-medium">Customer</h2>
        <p>{order.customer_name}</p>
        <p><a href={`mailto:${order.customer_email}`} className="underline">{order.customer_email}</a></p>
        <p><a href={`tel:${order.customer_phone}`} className="underline">{order.customer_phone}</a></p>
        <p className="text-muted">{[a.street, a.suburb, a.city, a.province, a.postal_code].filter(Boolean).join(", ")}</p>
        {order.customer_notes && <p className="pt-1">Notes: {order.customer_notes}</p>}
      </section>

      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-medium">Items</h2>
        <ul className="space-y-1">{(items ?? []).map((i, n) => <li key={n} className="flex justify-between gap-3"><span>{i.quantity} × {i.product_name}</span><span>{formatZAR(i.line_total_zar)}</span></li>)}</ul>
        <div className="mt-3 space-y-1 border-t border-line pt-2">
          <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{formatZAR(order.shipping_zar)}</span></div>
          <div className="flex justify-between font-medium"><span>Total</span><span>{formatZAR(order.total_zar)}</span></div>
        </div>
      </section>

      <section className="card p-4 text-sm">
        <h2 className="mb-1 font-medium">Payment</h2>
        <p className="text-muted">Method: {order.payment_method}</p>
        {proofUrl ? <a href={proofUrl} target="_blank" rel="noreferrer" className="btn btn-outline mt-3 w-full">View proof of payment</a> : <p className="mt-1 text-muted">No proof uploaded yet.</p>}
      </section>
    </div>
  );
}
