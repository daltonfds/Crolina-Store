import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { RETURN_STATUSES, reasonLabel, returnStatusMeta, typeLabel } from "@/lib/returns";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

export default async function ReturnsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  let q = createServiceClient().from("return_requests").select("id,reference,order_reference,customer_name,request_type,reason,status,created_at,updated_at").order("created_at", { ascending: false }).limit(100);
  if (sp.status && RETURN_STATUSES.some((s) => s.value === sp.status)) q = q.eq("status", sp.status);
  const rows = (await q).data ?? [];
  return <div className="space-y-4">
    <h1 className="text-xl font-medium">Returns &amp; refunds</h1>
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
      <Link href="/admin/returns" className={cn("chip", !sp.status && "chip-active")}>All</Link>
      {RETURN_STATUSES.map((s) => <Link key={s.value} href={`/admin/returns?status=${s.value}`} className={cn("chip", sp.status === s.value && "chip-active")}>{s.label}</Link>)}
    </div>
    <div className="card divide-y divide-line">
      {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">No requests yet.</p>}
      {rows.map((r) => <Link key={r.id} href={`/admin/returns/${r.id}`} className="flex items-center justify-between gap-3 p-4 text-sm">
        <span className="min-w-0">
          <span className="block font-medium">{r.reference} · {r.order_reference}</span>
          <span className="block truncate text-muted">{r.customer_name} · {typeLabel(r.request_type)} · {reasonLabel(r.reason)}</span>
          <span className="block text-xs text-muted">{new Date(r.created_at).toLocaleDateString("en-ZA")}</span>
        </span>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${returnStatusMeta(r.status).badge}`}>{returnStatusMeta(r.status).label}</span>
      </Link>)}
    </div>
  </div>;
}
