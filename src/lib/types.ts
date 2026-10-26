export type ProductStatus = "Active" | "Draft" | "Out of Stock";

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price_zar: number;
  compare_at_price_zar: number | null;
  condition: string;
  description: string;
  specs: Record<string, string>;
  image_urls: string[];
  stock_count: number;
  status: ProductStatus;
  featured: boolean;
  checkout_url: string | null;
  created_at: string;
};

export const PRODUCT_COLUMNS =
  "id,name,slug,category,price_zar,compare_at_price_zar,condition,description,specs,image_urls,stock_count,status,featured,checkout_url,created_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProduct(r: any): Product {
  return {
    ...r,
    price_zar: Number(r.price_zar),
    compare_at_price_zar: r.compare_at_price_zar == null ? null : Number(r.compare_at_price_zar),
    specs: r.specs && typeof r.specs === "object" ? r.specs : {},
    image_urls: Array.isArray(r.image_urls) ? r.image_urls : [],
    description: r.description ?? "",
    checkout_url: r.checkout_url ?? null,
  } as Product;
}

export const isSoldOut = (p: Pick<Product, "status" | "stock_count">) =>
  p.status !== "Active" || p.stock_count <= 0;

export type OrderStatus =
  | "pending_payment" | "proof_submitted" | "paid" | "processing"
  | "shipped" | "completed" | "cancelled" | "refunded";

export const ORDER_STATUSES: { value: OrderStatus; label: string; badge: string }[] = [
  { value: "pending_payment", label: "Pending payment", badge: "bg-soft-sand text-deep-sand" },
  { value: "proof_submitted", label: "Proof submitted", badge: "bg-soft-lilac text-deep-lilac" },
  { value: "paid", label: "Paid", badge: "bg-soft-green text-deep-green" },
  { value: "processing", label: "Processing", badge: "bg-soft-blue text-deep-blue" },
  { value: "shipped", label: "Shipped", badge: "bg-soft-blue text-deep-blue" },
  { value: "completed", label: "Completed", badge: "bg-soft-green text-deep-green" },
  { value: "cancelled", label: "Cancelled", badge: "bg-soft-pink text-deep-pink" },
  { value: "refunded", label: "Refunded", badge: "bg-soft-pink text-deep-pink" },
];

export const statusMeta = (s: string) => ORDER_STATUSES.find((x) => x.value === s) ?? ORDER_STATUSES[0];
