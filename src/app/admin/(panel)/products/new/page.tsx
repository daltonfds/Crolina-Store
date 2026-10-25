import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewProduct() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("products").select("category");
  const categories = [...new Set((data ?? []).map((r) => r.category as string))];
  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-medium">Add product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
