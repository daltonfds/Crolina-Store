import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { STORE } from "@/lib/config";
import { formatZAR } from "@/lib/money";
import { statusMeta } from "@/lib/types";

export default async function Dashboard() {
  const { sb } = await requireAdmin();
  // Start of "today" in South Africa (UTC+2)
  const sast = new Date(Date.now() + 2 * 3600_000);
  sast.setUTCHours(0, 0, 0, 0);
  const start = new Date(sast.getTime() - 2 * 3600_000).toISOString();

  const [today, active, low, recent] = await Promise.all([
    sb.from("orders").select("total_zar,status").gte("created_at", start),
    sb.from("products").select("id", { count: "exact", head: true }).eq("status", "Active"),
    sb.from("products").select("id", { count: "exact", head: true }).eq("status", "Active").lte("stock_count", STORE.lowStock),
    sb.from("orders").select("id,order_reference,customer_name,total_zar,status,created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  const orders = today.data ?? [];
  const live = orders.filter((o) => !["cancelled", "refunded"].includes(o.status));
  const revenue = orders.filter((o) => ["paid", "processing", "shipped", "completed"].includes(o.status)).reduce((t, o) => t + Number(o.total_zar), 0);
  const cards = [
    { label: "Revenue today", value: formatZAR(revenue), cls: "bg-white" },
    { label: "Orders today", value: String(live.length), cls: "bg-white" },
    { label: "Active products", value: String(active.count ?? 0), cls: "bg-white" },
    { label: "Low stock", value: String(low.count ?? 0), cls: "bg-soft-sand text-deep-sand" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Dashboard</h1>
        <Link href="/admin/products/new" className="btn btn-primary !h-10"><Plus size={18} /> Add product</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border border-line p-4 ${c.cls}`}>
            <p className="text-xs opacity-70">{c.label}</p>
            <p className="mt-1 text-xl font-medium">{c.value}</p>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-2 flex items-baseline justify-between"><h2 className="font-medium">Recent orders</h2><Link href="/admin/orders" className="text-sm text-muted underline">View all</Link></div>
        <div className="card divide-y divide-line">
          {(recent.data ?? []).length === 0 && <p className="p-6 text-center text-sm text-muted">No orders yet.</p>}
          {(recent.data ?? []).map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div><p className="text-sm font-medium">{o.order_reference}</p><p className="text-xs text-muted">{o.customer_name} · {formatZAR(o.total_zar)}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs ${statusMeta(o.status).badge}`}>{statusMeta(o.status).label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
