"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, CheckCircle2, CircleDot, Clock3, CreditCard, ExternalLink, Eye, MousePointer2, Package, Search, ShoppingCart, UserRound, XCircle } from "lucide-react";

type EventRow = {
  id: string;
  visitor_id: string;
  session_id: string;
  event_type: string;
  path: string;
  page_title: string | null;
  product_name: string | null;
  referrer: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const EVENT_META: Record<string, { label: string; detail: string; icon: typeof Eye; tone: string }> = {
  page_view: { label: "Store visit", detail: "Opened a page", icon: Eye, tone: "bg-slate-100 text-slate-700" },
  product_view: { label: "Product viewed", detail: "Considered a product", icon: Package, tone: "bg-blue-50 text-blue-700" },
  add_to_cart: { label: "Added to bag", detail: "Shopping intent detected", icon: ShoppingCart, tone: "bg-violet-50 text-violet-700" },
  checkout_started: { label: "Checkout started", detail: "Entered checkout", icon: CreditCard, tone: "bg-amber-50 text-amber-800" },
  order_placed: { label: "Order placed", detail: "Order submitted successfully", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
  checkout_completed: { label: "Checkout completed", detail: "Checkout completion event", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
  cookie_accepted: { label: "Cookie choice", detail: "Made a cookie choice", icon: CircleDot, tone: "bg-slate-100 text-slate-700" },
  exit_prompt_opened: { label: "Exit offer shown", detail: "Saw the leave-page offer", icon: MousePointer2, tone: "bg-pink-50 text-pink-700" },
};

function fmtDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }).format(new Date(value));
}
function fmtTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Africa/Johannesburg" }).format(new Date(value));
}
function sourceLabel(rows: EventRow[]) {
  const meta = rows.find(r => r.metadata && Object.keys(r.metadata).length)?.metadata || {};
  const source = String(meta.utm_source || "");
  const medium = String(meta.utm_medium || "");
  if (source || medium) return [source || "Campaign", medium].filter(Boolean).join(" · ");
  const ref = rows.find(r => r.referrer)?.referrer || "";
  try { return ref ? new URL(ref).hostname.replace(/^www\./, "") : "Direct / unknown"; } catch { return "Direct / unknown"; }
}
function productLabel(e: EventRow) {
  if (e.product_name) return e.product_name;
  if (e.page_title) return e.page_title;
  try { return decodeURIComponent(e.path.split("?")[0].split("/").filter(Boolean).pop() || "Store page").replaceAll("-", " "); } catch { return e.path; }
}

export default function VisitorJourneysPage({ events }: { events: EventRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const journeys = useMemo(() => {
    const grouped = new Map<string, EventRow[]>();
    for (const e of events) {
      const list = grouped.get(e.session_id) || [];
      list.push(e);
      grouped.set(e.session_id, list);
    }
    const now = Date.now();
    return [...grouped.entries()].map(([session, rows]) => {
      rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const hasOrder = rows.some(e => ["order_placed", "checkout_completed"].includes(e.event_type));
      const checkout = rows.some(e => e.event_type === "checkout_started");
      const last = rows[rows.length - 1];
      const stale = now - new Date(last.created_at).getTime() > 30 * 60_000;
      const status = hasOrder ? "converted" : checkout && stale ? "abandoned" : checkout ? "checkout" : "browsing";
      return { session, rows, visitor: rows[0]?.visitor_id || "unknown", last, status, source: sourceLabel(rows) };
    }).sort((a, b) => new Date(b.last?.created_at || 0).getTime() - new Date(a.last?.created_at || 0).getTime());
  }, [events]);
  const filtered = journeys.filter(j => {
    const haystack = [j.visitor, j.source, ...j.rows.map(e => [e.product_name, e.page_title, e.path].join(" "))].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase()) && (filter === "all" || j.status === filter);
  });
  const counts = {
    sessions: journeys.length,
    browsing: journeys.filter(j => j.status === "browsing").length,
    checkout: journeys.filter(j => j.status === "checkout").length,
    abandoned: journeys.filter(j => j.status === "abandoned").length,
    converted: journeys.filter(j => j.status === "converted").length,
  };
  const statusStyle: Record<string, string> = {
    browsing: "bg-slate-100 text-slate-700",
    checkout: "bg-amber-50 text-amber-800",
    abandoned: "bg-rose-50 text-rose-700",
    converted: "bg-emerald-50 text-emerald-700",
  };
  const statusLabel: Record<string, string> = {
    browsing: "Browsing", checkout: "In checkout", abandoned: "Possible abandonment", converted: "Order placed",
  };

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-3xl bg-[#101828] p-5 text-white sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"><Activity size={14} /> Live store intelligence</div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Visitor journeys</h1>
            <p className="mt-2 text-sm leading-6 text-white/70">Follow the path from campaign click to product interest, bag, checkout and order — all in one visual timeline.</p>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-4 sm:block"><ArrowDownRight size={30} /></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Sessions", counts.sessions, "All tracked visits"],
            ["Browsing", counts.browsing, "Exploring products"],
            ["In checkout", counts.checkout, "Checkout not finished"],
            ["Possible exits", counts.abandoned, "No order after 30 min"],
            ["Orders placed", counts.converted, "Order submitted"],
          ].map(([label, value, note]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><p className="text-xs text-white/60">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-white/50">{note}</p></div>)}
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 sm:flex-row">
        <label className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={e => setQuery(e.target.value)} className="field !pl-10" placeholder="Search visitor, product or campaign…" /></label>
        <select className="field sm:w-56" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter journeys">
          <option value="all">All journeys</option><option value="browsing">Browsing</option><option value="checkout">In checkout</option><option value="abandoned">Possible abandonment</option><option value="converted">Order placed</option>
        </select>
      </section>

      {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-14 text-center"><Activity className="mx-auto mb-3 text-muted" size={30} /><h2 className="font-medium">No journeys match yet</h2><p className="mt-1 text-sm text-muted">New tracked activity will appear here after visitors browse the storefront.</p></div> :
        <div className="space-y-4">
          {filtered.map(j => (
            <article key={j.session} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1f5f9] text-slate-700"><UserRound size={21} /></div>
                  <div><p className="font-medium">Visitor {j.visitor.slice(0, 8)}</p><p className="mt-0.5 text-xs text-muted">{j.rows.length} tracked steps · {j.last ? fmtDate(j.last.created_at) : ""}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f3f5f8] px-3 py-1.5 text-xs text-slate-700">{j.source}</span><span className={`rounded-full px-3 py-1.5 text-xs font-medium ${statusStyle[j.status]}`}>{statusLabel[j.status]}</span></div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted"><Clock3 size={14} /> Customer path</div>
                <ol className="space-y-0">
                  {j.rows.map((e, i) => {
                    const meta = EVENT_META[e.event_type] || { label: e.event_type.replaceAll("_", " "), detail: "Tracked activity", icon: CircleDot, tone: "bg-slate-100 text-slate-700" };
                    const Icon = meta.icon;
                    const m = e.metadata || {};
                    const campaign = m.utm_campaign ? String(m.utm_campaign) : "";
                    const content = m.utm_content ? String(m.utm_content) : "";
                    return <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {i < j.rows.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-1.5rem)] w-px bg-line" />}
                      <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}><Icon size={17} /></span>
                      <div className="min-w-0 flex-1 rounded-xl border border-line/80 bg-[#fcfcfd] p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-medium">{meta.label}</p><p className="mt-0.5 break-words text-sm text-muted">{productLabel(e)}</p></div><time className="shrink-0 text-xs text-muted">{fmtTime(e.created_at)}</time></div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {e.event_type === "product_view" && <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] text-blue-700">Product interest</span>}
                          {e.event_type === "add_to_cart" && <span className="rounded-md bg-violet-50 px-2 py-1 text-[11px] text-violet-700">Purchase intent</span>}
                          {e.event_type === "checkout_started" && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-800">Checkout funnel</span>}
                          {e.event_type === "order_placed" && <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">Order submitted</span>}
                          {campaign && <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">Campaign {campaign}</span>}
                          {content && <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">Ad {content}</span>}
                          {e.path && <a href={e.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted underline">Open page <ExternalLink size={11} /></a>}
                        </div>
                      </div>
                    </li>;
                  })}
                </ol>
              </div>
            </article>
          ))}
        </div>}
      <p className="text-xs leading-5 text-muted">Privacy note: visitor IDs are pseudonymous, not names. Email and WhatsApp appear only when visitors voluntarily submit them. “Possible abandonment” is an estimate: checkout was started, no order event was seen, and activity stopped for at least 30 minutes.</p>
    </div>
  );
}
