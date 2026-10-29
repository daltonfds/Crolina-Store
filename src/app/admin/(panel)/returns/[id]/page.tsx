import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { NEXT_STATUSES, RETURNS, returnStatusMeta, reasonLabel, typeLabel, type ReturnRow } from "@/lib/returns";
import { createServiceClient } from "@/lib/supabase/service";
import { updateReturn } from "../../../returns-actions";

const HINTS: Record<string, string> = {
  info_requested: "Say exactly what you need from the customer. They reply to the email.",
  approved: "Say what was approved (return, exchange or refund) and any conditions, e.g. item unused and in original packaging. The customer then chooses collection or send-back.",
  rejected: "Explain the reason clearly and politely, and mention any rights that still apply.",
  awaiting_return: "If the customer chose collection: give the collection date and window. If they send it back: give the return address and what to include in the parcel.",
  received: "Optional note, e.g. what you found when you inspected the item.",
  completed: "For a refund: enter the refund amount. For an exchange: say when the new item ships.",
};

export default async function ReturnDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sp = await searchParams;
  const sb = createServiceClient();
  const { data } = await sb.from("return_requests").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const r = data as ReturnRow;
  const [{ data: events }, { data: order }] = await Promise.all([
    sb.from("return_events").select("status,message,actor,emailed,created_at").eq("return_id", id).order("created_at", { ascending: true }),
    sb.from("orders").select("id,total_zar,status").eq("id", r.order_id).maybeSingle(),
  ]);
  const photos = await Promise.all((r.photo_paths ?? []).map(async (p) => (await sb.storage.from("return-photos").createSignedUrl(p, 600)).data?.signedUrl).filter(Boolean) as Promise<string>[]);
  const meta = returnStatusMeta(r.status);
  const next = NEXT_STATUSES[r.status];
  const a = (r.collection_address ?? {}) as Record<string, string>;
  const daysOpen = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
  return <div className="max-w-2xl space-y-5">
    <Link href="/admin/returns" className="text-sm text-muted">← All requests</Link>
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-medium">{r.reference}</h1>
      <span className={`rounded-full px-3 py-1 text-xs ${meta.badge}`}>{meta.label}</span>
    </div>
    <p className="text-xs text-muted">Opened {daysOpen} day{daysOpen === 1 ? "" : "s"} ago · target about {RETURNS.processDays} days in total</p>
    {sp.saved && <p className="rounded-xl bg-soft-green px-3 py-2 text-sm text-deep-green">{sp.saved === "emailed" ? "Updated. Customer emailed." : sp.saved === "noemail" ? "Updated, but the email was NOT sent (check RESEND_API_KEY)." : "Updated."}</p>}
    {sp.error && <p className="rounded-xl bg-soft-pink px-3 py-2 text-sm text-deep-pink">{sp.error}</p>}
    <section className="card space-y-1 p-4 text-sm">
      <h2 className="mb-1 font-medium">{typeLabel(r.request_type)}</h2>
      <p>Order <Link className="underline" href={`/admin/orders/${r.order_id}`}>{r.order_reference}</Link>{order ? ` · ${order.status}` : ""}</p>
      <ul className="py-1">{r.items.map((i, n) => <li key={n}>{i.quantity} × {i.product_name}</li>)}</ul>
      <p className="text-muted">Reason: {reasonLabel(r.reason)}</p>
      {r.exchange_preference && <p className="text-muted">Wants instead: {r.exchange_preference}</p>}
      {r.details && <p className="whitespace-pre-line pt-1">{r.details}</p>}
      {photos.length > 0 && <div className="flex flex-wrap gap-2 pt-2">{photos.map((u, n) => <a key={n} href={u} target="_blank" rel="noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt={`Photo ${n + 1}`} className="h-24 w-24 rounded-lg object-cover" /></a>)}</div>}
    </section>
    <section className="card space-y-1 p-4 text-sm">
      <h2 className="mb-1 font-medium">Customer</h2>
      <p>{r.customer_name}</p>
      <p><a href={`mailto:${r.customer_email}`} className="underline">{r.customer_email}</a></p>
      {r.customer_phone && <p>{r.customer_phone}</p>}
      {r.return_method && <p className="pt-1">Return method: <b>{r.return_method === "collection" ? "Collection" : "Customer sends it back"}</b></p>}
      {r.return_method === "collection" && <p className="text-muted">{[a.street, a.suburb, a.city, a.province, a.postal_code].filter(Boolean).join(", ")} · {a.phone}</p>}
    </section>
    {next.length > 0 ? <form action={updateReturn} className="card space-y-3 p-4">
      <h2 className="font-medium">Next step</h2>
      <input type="hidden" name="id" value={r.id} />
      <select name="status" className="field" defaultValue={next[0]}>{next.map((s) => <option key={s} value={s}>{returnStatusMeta(s).label}</option>)}</select>
      <textarea name="message" rows={4} maxLength={3000} placeholder="Message to the customer (sent by email)" className="field h-auto py-3" />
      <div className="space-y-1">
        <label className="label" htmlFor="refund_amount">Refund amount (ZAR, only for refunds)</label>
        <input id="refund_amount" name="refund_amount" type="number" step="0.01" min="0" defaultValue={r.refund_amount_zar ?? ""} className="field" />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="send_email" defaultChecked className="h-4 w-4 accent-black" /> Email the customer</label>
      <ul className="space-y-1 text-xs text-muted">{next.filter((s) => HINTS[s]).map((s) => <li key={s}><b>{returnStatusMeta(s).label}:</b> {HINTS[s]}</li>)}</ul>
      <button className="btn btn-primary w-full">Update request</button>
      <p className="text-xs text-muted">Nothing is refunded automatically. Pay the refund yourself, then mark it Completed. Update the order status separately if needed.</p>
    </form> : <p className="text-sm text-muted">This request is closed.</p>}
    <section className="card space-y-2 p-4 text-sm">
      <h2 className="font-medium">History</h2>
      <ul className="space-y-2">{(events ?? []).map((e, n) => <li key={n}><span className="text-muted">{new Date(e.created_at).toLocaleString("en-ZA")} · {e.actor}</span><br />{returnStatusMeta(e.status).label}{e.emailed ? " · emailed" : ""}{e.message ? ` — ${e.message}` : ""}</li>)}</ul>
    </section>
  </div>;
}
