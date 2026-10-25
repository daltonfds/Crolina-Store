import Link from "next/link";
import { Plus } from "lucide-react";
import ProductThumb from "@/components/store/ProductThumb";
import { requireAdmin } from "@/lib/auth";
import { formatZAR } from "@/lib/money";
import { PRODUCT_COLUMNS, toProduct } from "@/lib/types";

const BADGE: Record<string, string> = {
  Active: "bg-soft-green text-deep-green", Draft: "bg-surface text-muted", "Out of Stock": "bg-soft-sand text-deep-sand",
};

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sb } = await requireAdmin();
  const q = ((await searchParams).q ?? "").replace(/[%,()\\*]/g, " ").trim();
  let query = sb.from("products").select(PRODUCT_COLUMNS).order("created_at", { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%`);
  const products = ((await query).data ?? []).map(toProduct);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary !h-10"><Plus size={18} /> Add product</Link>
      </div>
      <form><input name="q" defaultValue={q} placeholder="Search products" className="field" /></form>
      <div className="card divide-y divide-line">
        {products.length === 0 && <p className="p-8 text-center text-sm text-muted">No products yet. Tap “Add product” to create your first one.</p>}
        {products.map((p) => (
          <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center gap-3 p-3">
            <ProductThumb product={p} className="h-14 w-14 shrink-0 rounded-xl" iconSize={24} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted">{p.category} · {formatZAR(p.price_zar)} · {p.stock_count} in stock</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${BADGE[p.status]}`}>{p.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
