import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { STORE } from "@/lib/config";
import { formatZAR } from "@/lib/money";
import { statusMeta } from "@/lib/types";
import { createServiceClient } from "@/lib/supabase/service";

type Period = "24h" | "7d" | "30d" | "90d" | "365d" | "all";
const periods: { value: Period; label: string; ms: number | null }[] = [
  { value: "24h", label: "Last 24 hours", ms: 24 * 3600_000 },
  { value: "7d", label: "Last 7 days", ms: 7 * 24 * 3600_000 },
  { value: "30d", label: "Last 30 days", ms: 30 * 24 * 3600_000 },
  { value: "90d", label: "Last 90 days", ms: 90 * 24 * 3600_000 },
  { value: "365d", label: "Last 12 months", ms: 365 * 24 * 3600_000 },
  { value: "all", label: "All time", ms: null },
];
const revenueStatuses = ["paid", "processing", "shipped", "completed"];
const liveStatuses = ["cancelled", "refunded"];

function dateLabel(date: Date, period: Period) {
  return new Intl.DateTimeFormat("en-ZA", period === "24h" || period === "7d"
    ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }
    : { day: "2-digit", month: "short", year: "2-digit", timeZone: "Africa/Johannesburg" }).format(date);
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { sb } = await requireAdmin();
  const params = await searchParams;
  const period = periods.some(p => p.value === params.period) ? params.period as Period : "30d";
  const selected = periods.find(p => p.value === period)!;
  const from = selected.ms ? new Date(Date.now() - selected.ms).toISOString() : null;
  const service = createServiceClient();

  let ordersQuery = sb.from("orders").select("id,order_reference,customer_name,customer_email,total_zar,status,created_at").order("created_at", { ascending: false }).limit(1000);
  let visitorsQuery = service.from("store_visitor_events").select("visitor_id,session_id,event_type,path,page_title,product_name,created_at").order("created_at", { ascending: false }).limit(3000);
  if (from) {
    ordersQuery = ordersQuery.gte("created_at", from);
    visitorsQuery = visitorsQuery.gte("created_at", from);
  }

  const [ordersResult, active, low, recent, visitorResult, contactsResult, contactsCount] = await Promise.all([
    ordersQuery,
    sb.from("products").select("id", { count: "exact", head: true }).eq("status", "Active"),
    sb.from("products").select("id", { count: "exact", head: true }).eq("status", "Active").lte("stock_count", STORE.lowStock),
    sb.from("orders").select("id,order_reference,customer_name,total_zar,status,created_at").order("created_at", { ascending: false }).limit(5),
    visitorsQuery,
    service.from("store_marketing_contacts").select("name,email,whatsapp,source,marketing_consent,created_at").order("created_at", { ascending: false }).limit(12),
    service.from("store_marketing_contacts").select("id", { count: "exact", head: true }),
  ]);

  const orders = ordersResult.data ?? [];
  const live = orders.filter(o => !liveStatuses.includes(o.status));
  const paid = orders.filter(o => revenueStatuses.includes(o.status));
  const revenue = paid.reduce((total, o) => total + Number(o.total_zar), 0);
  const events = visitorResult.data ?? [];
  const uniqueVisitors = new Set(events.map(e => e.visitor_id)).size;
  const sessions = new Set(events.map(e => e.session_id)).size;
  const pageViews = events.filter(e => ["page_view", "product_view"].includes(e.event_type)).length;

  const bucketMap = new Map<string, { label: string; revenue: number; orders: number }>();
  for (const order of [...orders].reverse()) {
    if (liveStatuses.includes(order.status)) continue;
    const d = new Date(order.created_at);
    let key: string;
    let label: string;
    if (period === "24h") {
      d.setMinutes(0, 0, 0); key = d.toISOString(); label = dateLabel(d, period);
    } else if (period === "7d" || period === "30d") {
      d.setHours(0, 0, 0, 0); key = d.toISOString().slice(0, 10); label = dateLabel(d, period);
    } else {
      d.setDate(1); d.setHours(0, 0, 0, 0); key = d.toISOString().slice(0, 7); label = new Intl.DateTimeFormat("en-ZA", { month: "short", year: "2-digit", timeZone: "Africa/Johannesburg" }).format(d);
    }
    const bucket = bucketMap.get(key) ?? { label, revenue: 0, orders: 0 };
    bucket.orders += 1;
    if (revenueStatuses.includes(order.status)) bucket.revenue += Number(order.total_zar);
    bucketMap.set(key, bucket);
  }
  const buckets = [...bucketMap.values()].slice(-12);
  const maxRevenue = Math.max(1, ...buckets.map(b => b.revenue));

  const journeys = new Map<string, typeof events>();
  for (const event of events) {
    const list = journeys.get(event.session_id) ?? [];
    list.push(event);
    journeys.set(event.session_id, list);
  }
  const recentJourneys = [...journeys.entries()].slice(0, 12).map(([session, rows]) => ({
    session,
    visitor: rows[0]?.visitor_id ?? "unknown",
    last: rows[0]?.created_at,
    steps: rows.slice(0, 8),
  }));

  const cards = [
    { label: "Revenue in period", value: formatZAR(revenue), cls: "bg-white" },
    { label: "Orders in period", value: String(live.length), cls: "bg-white" },
    { label: "Unique visitors", value: String(uniqueVisitors), cls: "bg-white" },
    { label: "Page views", value: String(pageViews), cls: "bg-white" },
    { label: "Saved contacts", value: String(contactsCount.count ?? 0), cls: "bg-white" },
    { label: "Active products", value: String(active.count ?? 0), cls: "bg-white" },
    { label: "Low stock", value: String(low.count ?? 0), cls: "bg-soft-sand text-deep-sand" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-medium">Dashboard</h1><p className="mt-1 text-sm text-muted">Store performance, sales and visitor journeys.</p></div>
        <Link href="/admin/products/new" className="btn btn-primary !h-10"><Plus size={18} /> Add product</Link>
      </div>

      <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3">
        <label htmlFor="period" className="text-sm text-muted">Reporting period</label>
        <select id="period" name="period" defaultValue={period} className="field !h-10 max-w-xs">
          {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <button className="btn btn-secondary !h-10" type="submit">Apply</button><span className="text-xs text-muted">Sales are counted from paid, processing, shipped and completed orders.</span>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        {cards.map(c => <div key={c.label} className={`rounded-2xl border border-line p-4 ${c.cls}`}><p className="text-xs opacity-70">{c.label}</p><p className="mt-1 text-xl font-medium">{c.value}</p></div>)}
      </div>
      <p className="text-xs text-muted">Tracked sessions: {sessions}. Visitor tracking starts after this feature is deployed; historical visits are not available.</p>

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="mb-4"><h2 className="font-medium">Sales over time</h2><p className="text-sm text-muted">{selected.label} · revenue and order count</p></div>
        {buckets.length === 0 ? <p className="py-8 text-center text-sm text-muted">No orders in this period yet.</p> : <div className="space-y-4">
          {buckets.map((b, i) => <div key={i} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-sm">
            <span className="text-xs text-muted">{b.label}</span>
            <div className="min-w-0"><div className="h-3 overflow-hidden rounded-full bg-[#eef3fb]"><div className="h-full rounded-full bg-[#1769d2]" style={{ width: `${Math.max(b.revenue ? 2 : 0, (b.revenue / maxRevenue) * 100)}%` }} /></div><p className="mt-1 text-xs text-muted">{b.orders} order{b.orders === 1 ? "" : "s"}</p></div>
            <span className="text-right text-xs font-medium">{formatZAR(b.revenue)}</span>
          </div>)}
        </div>}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between"><h2 className="font-medium">Recent orders</h2><Link href="/admin/orders" className="text-sm text-muted underline">View all</Link></div>
        <div className="card divide-y divide-line">
          {(recent.data ?? []).length === 0 && <p className="p-6 text-center text-sm text-muted">No orders yet.</p>}
          {(recent.data ?? []).map(o => <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <div><p className="text-sm font-medium">{o.order_reference}</p><p className="text-xs text-muted">{o.customer_name} · {formatZAR(o.total_zar)} · {dateLabel(new Date(o.created_at), period)}</p></div>
            <span className={`rounded-full px-3 py-1 text-xs ${statusMeta(o.status).badge}`}>{statusMeta(o.status).label}</span>
          </Link>)}
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><div><h2 className="font-medium">Captured contacts</h2><p className="text-sm text-muted">Emails collected from cookie consent and exit prompts. Marketing messages are permitted only for visitors who opted in.</p></div><Link href="/admin/contacts" className="text-sm text-muted underline">View all contacts</Link></div>
        <div className="card divide-y divide-line">
          {(contactsResult.data ?? []).length === 0 && <p className="p-5 text-sm text-muted">No contact details captured yet.</p>}
          {(contactsResult.data ?? []).map((contact, i) => <div key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div><p className="text-sm font-medium">{contact.name}</p><p className="text-sm text-muted">{contact.email}{contact.whatsapp ? " · " + contact.whatsapp : ""}</p></div>
            <span className={"rounded-full px-2.5 py-1 text-xs " + (contact.marketing_consent ? "bg-soft-green text-deep-green" : "bg-soft-sand text-deep-sand")}>{contact.marketing_consent ? "Marketing opted in" : "No marketing consent"}</span>
          </div>)}
        </div>
      </section>

      <section>
        <div className="mb-2"><h2 className="font-medium">Visitor journeys</h2><p className="text-sm text-muted">Pages and actions visitors took in their latest sessions.</p></div>
        {recentJourneys.length === 0 ? <div className="card p-6 text-center text-sm text-muted">No visitor data yet. Apply the analytics migration in Supabase to start collecting visits.</div> : <div className="space-y-3">
          {recentJourneys.map(j => <div key={j.session} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-medium">Visitor {j.visitor.slice(0, 8)} · {j.steps.length} tracked steps</p><p className="text-xs text-muted">{j.last ? dateLabel(new Date(j.last), period) : ""}</p></div>
            <ol className="mt-3 space-y-2 border-l-2 border-line pl-3">
              {j.steps.slice().reverse().map((s, i) => <li key={i} className="text-sm"><span className="font-medium">{s.event_type.replaceAll("_", " ")}</span><span className="text-muted"> — {s.product_name || s.page_title || s.path}</span><span className="ml-2 text-xs text-muted">{new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }).format(new Date(s.created_at))}</span></li>)}
            </ol>
          </div>)}
        </div>}
      </section>
    </div>
  );
}
