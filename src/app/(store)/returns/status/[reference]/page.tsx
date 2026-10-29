import { notFound } from "next/navigation";
import ReturnActions from "@/components/store/ReturnActions";
import { RETURNS, RETURN_STATUSES, reasonLabel, returnStatusMeta, typeLabel } from "@/lib/returns";
import { loadReturn } from "@/lib/returns-server";
import { createServiceClient } from "@/lib/supabase/service";
import { STORE } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your request", robots: { index: false } };

const FLOW = ["submitted", "under_review", "approved", "awaiting_return", "received", "completed"] as const;

export default async function ReturnStatusPage({ params, searchParams }: { params: Promise<{ reference: string }>; searchParams: Promise<{ t?: string }> }) {
  const reference = (await params).reference.toUpperCase();
  const r = await loadReturn(reference, (await searchParams).t ?? "");
  if (!r) notFound();
  const sb = createServiceClient();
  const [{ data: events }, { data: order }] = await Promise.all([
    sb.from("return_events").select("status,message,actor,created_at").eq("return_id", r.id).order("created_at", { ascending: true }),
    sb.from("orders").select("shipping_address").eq("id", r.order_id).maybeSingle(),
  ]);
  const meta = returnStatusMeta(r.status);
  const idx = FLOW.indexOf(r.status as (typeof FLOW)[number]);
  const back = r.return_method === "send_back";
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className="text-sm text-muted">Request {r.reference} · Order {r.order_reference}</p>
        <h1 className="text-2xl font-medium">{typeLabel(r.request_type)}</h1>
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
      </div>

      <section className="card space-y-3 p-5">
        <p className="text-sm">{meta.customer}</p>
        {r.admin_message && <p className="whitespace-pre-line rounded-xl bg-surface p-3 text-sm">{r.admin_message}</p>}
        {r.status === "completed" && r.refund_amount_zar != null && <p className="text-sm">Refund amount: <b>R{Number(r.refund_amount_zar).toFixed(2)}</b></p>}
        {r.status === "awaiting_return" && (
          <p className="text-sm text-muted">{back ? "You chose to send the item to us. We emailed you the return address and instructions." : "You chose collection. We will email you the collection date."}</p>
        )}
      </section>

      {idx >= 0 && (
        <ol className="grid grid-cols-6 gap-1 text-center text-[10px] text-muted">
          {FLOW.map((s, i) => (
            <li key={s}><span className={`mx-auto mb-1 block h-1.5 rounded-full ${i <= idx ? "bg-ink" : "bg-line"}`} />{RETURN_STATUSES.find((x) => x.value === s)!.label}</li>
          ))}
        </ol>
      )}

      <section className="card space-y-2 p-5 text-sm">
        <h2 className="font-medium">Your request</h2>
        <ul>{r.items.map((i, n) => <li key={n}>{i.quantity} × {i.product_name}</li>)}</ul>
        <p className="text-muted">Reason: {reasonLabel(r.reason)}</p>
        {r.exchange_preference && <p className="text-muted">Exchange for: {r.exchange_preference}</p>}
        {r.details && <p className="whitespace-pre-line text-muted">{r.details}</p>}
      </section>

      <ReturnActions reference={r.reference} token={r.access_token} status={r.status} initialAddress={(order?.shipping_address ?? {}) as Record<string, string>} phone={r.customer_phone ?? ""} />

      {(events ?? []).length > 0 && (
        <section className="space-y-2 text-sm">
          <h2 className="font-medium">History</h2>
          <ul className="space-y-1 text-muted">
            {(events ?? []).map((e, n) => <li key={n}>{new Date(e.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {returnStatusMeta(e.status).label}</li>)}
          </ul>
        </section>
      )}
      <p className="text-xs text-muted">Please allow around {RETURNS.processDays} days for the full process. We keep you updated by email ({STORE.email}).</p>
    </div>
  );
}
