"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ORDER_STATUSES } from "@/lib/types";

export type FormState = { error: string };

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword({
    email: String(fd.get("email") ?? "").trim(),
    password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: "Invalid email or password." };
  if (!(await getAdmin())) {
    await sb.auth.signOut();
    return { error: "This account is not an administrator." };
  }
  redirect("/admin");
}

export async function logout() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}

const num = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === "" ? null : Number(v));

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(180),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only use lowercase letters, numbers and hyphens").max(120),
  category: z.string().trim().min(2, "Choose or type a category").max(60),
  price: z.number({ error: "Enter a valid price" }).min(0).max(1_000_000),
  compare: z.number().min(0).max(1_000_000).nullable(),
  stock: z.number({ error: "Enter a valid stock quantity" }).int().min(0).max(100000),
  condition: z.enum(["New", "Used - Like New", "Used", "Single item"]),
  status: z.enum(["Active", "Draft", "Out of Stock"]),
  description: z.string().max(5000),
  brand: z.string().max(80),
  pack_size: z.string().max(60),
  flavour: z.string().max(60),
  ingredients: z.string().max(5000),
  how_to_use: z.string().max(3000),
  warnings: z.string().max(3000),
  checkout: z.string().trim().url("Enter a valid payment link").refine((u) => u.startsWith("https://"), "The payment link must start with https://").nullable(),
});

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const { sb } = await requireAdmin();
  const parsed = productSchema.safeParse({
    name: fd.get("name"), slug: fd.get("slug"), category: fd.get("category"),
    price: num(fd.get("price")), compare: num(fd.get("compare")), stock: num(fd.get("stock")),
    condition: fd.get("condition"), status: fd.get("status"), description: String(fd.get("description") ?? ""),
    brand: String(fd.get("brand") ?? ""), pack_size: String(fd.get("pack_size") ?? ""), flavour: String(fd.get("flavour") ?? ""),
    ingredients: String(fd.get("ingredients") ?? ""), how_to_use: String(fd.get("how_to_use") ?? ""), warnings: String(fd.get("warnings") ?? ""),
    checkout: String(fd.get("checkout_url") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;

  let images: string[] = [];
  try { images = z.array(z.string().url()).max(10).parse(JSON.parse(String(fd.get("image_urls") || "[]"))); }
  catch { return { error: "Invalid images." }; }

  const specs: Record<string, string> = {};
  String(fd.get("specs") ?? "").split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0 && line.slice(i + 1).trim()) specs[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });

  const stock = v.condition === "Single item" && v.stock > 0 ? 1 : v.stock;
  let status = v.status;
  if (status === "Active" && stock <= 0) status = "Out of Stock";
  if (status === "Out of Stock" && stock > 0) status = "Active";

  const row = {
    name: v.name, slug: v.slug, category: v.category, price_zar: v.price, compare_at_price_zar: v.compare,
    stock_count: stock, condition: v.condition, status, description: v.description, specs,
    brand: v.brand.trim() || null, pack_size: v.pack_size.trim() || null, flavour: v.flavour.trim() || null,
    ingredients: v.ingredients.trim() || null, how_to_use: v.how_to_use.trim() || null, warnings: v.warnings.trim() || null,
    image_urls: images, featured: fd.get("featured") === "on",
    checkout_url: v.checkout,
  };
  const id = String(fd.get("id") ?? "");
  const { error } = id ? await sb.from("products").update(row).eq("id", id) : await sb.from("products").insert(row);
  if (error) return { error: error.code === "23505" ? "That slug is already used by another product." : error.message };
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(fd: FormData) {
  const { sb } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const { error } = await sb.from("products").delete().eq("id", id);
  // Products that already have orders cannot be deleted: hide them instead.
  if (error) await sb.from("products").update({ status: "Draft" }).eq("id", id);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function updateOrderStatus(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!ORDER_STATUSES.some((s) => s.value === status)) return;
  await createServiceClient().rpc("set_store_order_status", { p_order_id: id, p_status: status });
  revalidatePath("/admin", "layout");
  redirect(`/admin/orders/${id}?saved=1`);
}

export async function saveBankDetails(fd: FormData) {
  const { sb } = await requireAdmin();
  const t = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const row = {
    account_name: t("account_name"), bank_name: t("bank_name"), account_number: t("account_number"),
    branch_code: t("branch_code"), payment_link_url: t("payment_link_url"), eft_instructions: t("eft_instructions"),
    is_active: true,
  };
  const { data: existing } = await sb.from("bank_details").select("id").limit(1).maybeSingle();
  if (existing) await sb.from("bank_details").update(row).eq("id", existing.id);
  else await sb.from("bank_details").insert(row);
  redirect("/admin/settings?saved=1");
}
