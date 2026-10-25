import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_COLUMNS, toProduct } from "@/lib/types";
import { deleteProduct } from "../../../actions";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { sb } = await requireAdmin();
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data }, { data: cats }] = await Promise.all([
    sb.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle(),
    sb.from("products").select("category"),
  ]);
  if (!data) notFound();
  const categories = [...new Set((cats ?? []).map((r) => r.category as string))];
  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="mb-4 text-xl font-medium">Edit product</h1>
        <ProductForm product={toProduct(data)} categories={categories} />
      </div>
      <form action={deleteProduct} className="border-t border-line pt-6">
        <input type="hidden" name="id" value={id} />
        <button className="text-sm text-danger underline">Delete product</button>
        <p className="mt-1 text-xs text-muted">If the product already has orders it will be hidden (Draft) instead of deleted.</p>
      </form>
    </div>
  );
}
