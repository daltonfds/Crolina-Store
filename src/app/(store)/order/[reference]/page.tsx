import Link from "next/link";
import { notFound } from "next/navigation";
import AutoPay from "@/components/store/AutoPay";
import { whatsappUrl } from "@/lib/config";
import { formatZAR } from "@/lib/money";
import { createServiceClient } from "@/lib/supabase/service";
import { statusMeta } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ reference: string }>; searchParams: Promise<{ pay?: string }> }) {
  const reference = decodeURIComponent((await params).reference).toUpperCase();
  if (!/^CR-[A-F0-9]{10}$/.test(reference)) notFound();
  const sb = createServiceClient();
  const { data: order } = await sb.from("orders").select("*").eq("order_reference", reference).maybeSingle();
  if (!order) notFound();
  const { data: items } = await sb.from("order_items").select("product_name,unit_price_zar,quantity,line_total_zar").eq("order_id", order.id);
  const autoPay = (await searchParams).pay === "1" && order.status === "pending_payment" && order.payment_method === "payment_link" && !!order.payment_link_url;
  const meta = statusMeta(order.status);
  const open = ["pending_payment", "proof_submitted"].includes(order.status);
  const addr = (order.shipping_address ?? {}) as Record<string, string>;
  const deliveryWindow = addr.delivery_method === "express" ? "1–3 business days" : "1–5 business days";
  const wa = whatsappUrl(`Hi Crolina, about my order ${reference}`);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-muted">Order {reference}</p>
        <h1 className="text-2xl font-medium">Thank you, {String(order.customer_name).split(" ")[0]}</h1>
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
      </div>

      {autoPay && <AutoPay url={order.payment_link_url} />}

      {open && (
        <section className="card space-y-4 p-5">
          {order.payment_link_url ? (
            <>
              <h2 className="text-base font-medium">Pay online</h2>
              <a href={order.payment_link_url} target="_blank" rel="noreferrer" className="btn btn-primary w-full">Pay now</a>
              <p className="text-xs text-muted">Use {reference} as your payment reference.</p>
            </>
          ) : (
            <p className="text-sm text-muted">Payment link unavailable. Please contact us for assistance.</p>
          )}
        </section>
      )}

      {["paid", "processing", "shipped", "completed"].includes(order.status) && (
        <p className="text-sm text-muted">Problem with this order? <Link href={`/returns/request?order=${reference}`} className="underline">Request a return, exchange or refund</Link>.</p>
      )}

      <section className="card p-5">
        <h2 className="mb-3 text-base font-medium">Items</h2>
        <ul className="space-y-2 text-sm">
          {(items ?? []).map((i, n) => (
            <li key={n} className="flex justify-between gap-3"><span>{i.quantity} × {i.product_name}</span><span>{formatZAR(i.line_total_zar)}</span></li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatZAR(order.subtotal_zar)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{Number(order.shipping_zar) === 0 ? "Free" : formatZAR(order.shipping_zar)}</span></div>
          <div className="flex justify-between text-base font-medium"><span>Total</span><span>{formatZAR(order.total_zar)}</span></div>
        </div>
      </section>

      <section className="card p-5 text-sm">
        <h2 className="mb-2 text-base font-medium">Delivery to</h2>
        <p>{[addr.street, addr.suburb, addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ")}</p>
        <p className="mt-2 text-muted">Estimated delivery in {deliveryWindow}, nationwide, after your payment is confirmed.</p>
      </section>
      {wa && <a href={wa} target="_blank" rel="noreferrer" className="block text-center text-sm text-muted underline">Need help? Chat on WhatsApp</a>}
    </div>
  );
}