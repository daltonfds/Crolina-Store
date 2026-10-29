import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visitor insights", robots: { index: false, follow: false } };

const money = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

export default async function AnalyticsPage() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await auth.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return <main className="mx-auto max-w-4xl p-8"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2">This panel is restricted to authorised store administrators.</p></main>;

  const sb = createServiceClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: events }, { data: affiliates }, { data: abandoned }, { data: orders }] = await Promise.all([
    sb.from("store_visitor_events").select("visitor_id,session_id,event_type,path,page_title,product_name,referrer,affiliate_code,duration_seconds,created_at,metadata").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
    sb.from("store_affiliates").select("id,code,name,email,status,commission_percent,created_at").order("created_at", { ascending: false }).limit(100),
    sb.from("store_abandoned_checkouts").select("id,contact_email,contact_phone,checkout_path,cart_total_zar,status,last_activity_at,marketing_consent,affiliate_code").order("last_activity_at", { ascending: false }).limit(100),
    sb.from("orders").select("id,total_zar,status,created_at").gte("created_at", since).limit(500),
  ]);
  const rows = events ?? [];
  const visitors = new Set(rows.map((r) => r.visitor_id)).size;
  const sessions = new Set(rows.map((r) => r.session_id)).size;
  const checkoutSessions = new Set(rows.filter((r) => r.event_type === "checkout_started").map((r) => r.session_id)).size;
  const totalOrders = orders?.length ?? 0;
  const totalSales = (orders ?? []).reduce((n, o) => n + (["paid", "processing", "shipped", "delivered"].includes(String(o.status).toLowerCase()) ? Number(o.total_zar) : 0), 0);
  const pathCounts = new Map<string, number>();
  rows.filter((r) => r.event_type === "page_view").forEach((r) => pathCounts.set(r.path.split("?")[0], (pathCounts.get(r.path.split("?")[0]) ?? 0) + 1));
  const topPaths = [...pathCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 6);
  const barMax = Math.max(1, ...topPaths.map(([, count]) => count));
  const card = "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm";
  return <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-900 md:px-8">
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-neutral-500">Crolina Shop / Admin</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Visitor insights</h1><p className="mt-2 text-sm text-neutral-500">Real store events from the last 7 days. Visitor IDs are pseudonymous until a customer provides contact details.</p></div><a className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white" href="/admin">Admin dashboard</a></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[["Unique visitors", visitors.toLocaleString("en-ZA")],["Sessions", sessions.toLocaleString("en-ZA")],["Checkout starts", checkoutSessions.toLocaleString("en-ZA")],["Orders created", totalOrders.toLocaleString("en-ZA")],["Confirmed sales", money(totalSales)]].map(([label,value])=><div className={card} key={label}><p className="text-sm text-neutral-500">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-neutral-400">Last 7 days</p></div>)}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className={card}><h2 className="text-lg font-semibold">Most visited pages</h2><p className="mb-5 mt-1 text-sm text-neutral-500">Page views recorded by the store tracker</p><div className="space-y-4">{topPaths.map(([path,count])=><div key={path}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{path}</span><span className="font-semibold">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-neutral-900" style={{width:`${count/barMax*100}%`}}/></div></div>)}{!topPaths.length&&<p className="text-sm text-neutral-500">No page-view events yet.</p>}</div></div>
        <div className={card}><h2 className="text-lg font-semibold">Recent visitor activity</h2><p className="mb-4 mt-1 text-sm text-neutral-500">Chronological event trail</p><div className="max-h-[360px] space-y-3 overflow-auto">{rows.slice(0,30).map((e,i)=><div className="flex gap-3 border-b border-neutral-100 pb-3" key={e.session_id+e.created_at+i}><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-neutral-900"/><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-medium">{String(e.event_type).replaceAll("_"," ")}</p><time className="text-xs text-neutral-400">{date(e.created_at)}</time></div><p className="mt-1 truncate text-sm text-neutral-600">{e.path}</p><p className="mt-1 text-xs text-neutral-400">Visitor {e.visitor_id.slice(0,8)} · Session {e.session_id.slice(0,8)}{e.duration_seconds != null ? ` · ${e.duration_seconds}s` : ""}</p></div></div>)}{!rows.length&&<p className="text-sm text-neutral-500">No visitor events recorded yet.</p>}</div></div>
      </section>
      <section className={card}><h2 className="text-lg font-semibold">Affiliate programme</h2><p className="mb-4 mt-1 text-sm text-neutral-500">Review applications and performance records.</p><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-neutral-500"><th className="py-3">Affiliate</th><th>Email</th><th>Code</th><th>Status</th><th>Commission</th></tr></thead><tbody>{(affiliates??[]).map(a=><tr className="border-b border-neutral-100" key={a.id}><td className="py-3 font-medium">{a.name}</td><td>{a.email}</td><td><code>{a.code}</code></td><td><span className="rounded-full bg-neutral-100 px-2 py-1">{a.status}</span></td><td>{a.commission_percent}%</td></tr>)}</tbody></table>{!affiliates?.length&&<p className="py-4 text-sm text-neutral-500">No affiliate applications yet.</p>}</div></section>
      <section className={card}><h2 className="text-lg font-semibold">Checkout recovery queue</h2><p className="mb-4 mt-1 text-sm text-neutral-500">Contact details appear only when the customer has supplied them. Automated marketing requires consent.</p><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-neutral-500"><th className="py-3">Last activity</th><th>Contact</th><th>Checkout</th><th>Cart value</th><th>Status</th><th>Consent</th></tr></thead><tbody>{(abandoned??[]).map(a=><tr className="border-b border-neutral-100" key={a.id}><td className="py-3">{date(a.last_activity_at)}</td><td>{a.contact_email||"—"}<br/>{a.contact_phone||""}</td><td>{a.checkout_path}</td><td>{a.cart_total_zar==null?"—":money(Number(a.cart_total_zar))}</td><td>{a.status}</td><td>{a.marketing_consent?"Yes":"No"}</td></tr>)}</tbody></table>{!abandoned?.length&&<p className="py-4 text-sm text-neutral-500">No abandoned checkout records yet. The checkout flow must submit recovery details to populate this queue.</p>}</div></section>
    </div>
  </main>;
}
