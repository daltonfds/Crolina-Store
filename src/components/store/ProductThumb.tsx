import { Gem, Glasses, Package, Shirt, ShoppingBag } from "lucide-react";
import { cn, tintFor } from "@/lib/utils";
import type { Product } from "@/lib/types";

function iconFor(category: string) {
  const c = category.toLowerCase();
  if (/(bag|tote|purse)/.test(c)) return ShoppingBag;
  if (/(glass|sun)/.test(c)) return Glasses;
  if (/(access|jewel|watch|necklace)/.test(c)) return Gem;
  if (/(women|men|cloth|shirt|dress|top|fashion)/.test(c)) return Shirt;
  return Package;
}

export default function ProductThumb({
  product, className, iconSize = 44,
}: { product: Pick<Product, "id" | "name" | "category" | "image_urls">; className?: string; iconSize?: number }) {
  const tint = tintFor(product.id);
  const img = product.image_urls?.[0];
  const Icon = iconFor(product.category);
  return (
    <div className={cn("relative overflow-hidden", tint.bg, className)}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center", tint.fg)}>
          <Icon size={iconSize} strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
