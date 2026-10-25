import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatZAR } from "@/lib/money";
import { ORDER_STATUSES, statusMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { sb } = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").replace(/[%,()\\*]/g, " ").trim();
  let query = sb.from("orders").select("id,order_reference,customer_name,customer_email,total_zar,status,created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (sp.status && ORDER_STATUSES.some((s) => s.value === sp.status)) query = query.eq("status", sp.status);
  if (q) query = query.or(`order_reference.ilike.%${q}%,customer_email.ilike.%${q}%,customer_name.ilike.%${q}%`);
  const orders = (await query).data ?? [];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium">Orders</h1>
      <form><input name="q" defaultValue={q} placeholder="Search reference, name or email" className="field" />{sp.status && <input type="hidden" name="status" value={sp.status} />}</form>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <Link href="/admin/orders" className={cn("chip", !sp.status && "chip-active")}>All</Link>
        {ORDER_STATUSES.map((s) => <Link key={s.value} href={`/admin/orders?status=${s.value}`} className={cn("chip", sp.status === s.value && "chip-active")}>{s.label}</Link>)}
      </div>
      <div className="card divide-y divide-line">
        {orders.length === 0 && <p className="p-8 text-center text-sm text-muted">No orders found.</p>}
        {orders.map((o) => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{o.order_reference}</p>
              <p className="truncate text-xs text-muted">{o.customer_name} · {formatZAR(o.total_zar)} · {new Date(o.created_at).toLocaleDateString("en-ZA")}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusMeta(o.status).badge}`}>{statusMeta(o.status).label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
