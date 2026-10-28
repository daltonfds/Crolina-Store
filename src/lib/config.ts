export const STORE = {
  name: "Crolina",
  tagline: "Essential goods | South Africa",
  url: process.env.NEXT_PUBLIC_STORE_URL || "https://www.crolina.shop",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  standardShipping: 100,
  expressShipping: 150,
  /** Legacy fallback for components that still display a single delivery rate. */
  shippingFlat: 100,
  freeShippingOver: 2500,
  freeShippingMinItems: 5,
  lowStock: 3,
  deliveryTime: "1–5 business days",
  email: "support@crolina.shop",
  instagram: "crolina_za",
  facebook: "Crolina",
} as const;

export const instagramUrl = `https://www.instagram.com/${STORE.instagram}`;
export const facebookUrl = `https://www.facebook.com/${STORE.facebook}`;

export const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
] as const;

/** Categories shown on /supplements and given the supplement layout on the product page. */
export const SUPPLEMENT_CATEGORIES = ["Enlargement", "Libido Boosters", "Delay & Control", "Prostate Health"] as const;
export const isSupplement = (category: string) => (SUPPLEMENT_CATEGORIES as readonly string[]).includes(category);

export const CATEGORY_SUGGESTIONS = ["Women", "Men", "Accessories", "Home", "Beauty", "Essentials"];

export type DeliveryMethod = "standard" | "express";

export function qualifiesForFreeShipping(subtotalAfterDiscounts: number, itemCount: number) {
  return subtotalAfterDiscounts >= STORE.freeShippingOver || itemCount >= STORE.freeShippingMinItems;
}

export function shippingFor(
  subtotalAfterDiscounts: number,
  itemCount = 0,
  method: DeliveryMethod = "standard",
) {
  if (subtotalAfterDiscounts <= 0) return 0;
  if (qualifiesForFreeShipping(subtotalAfterDiscounts, itemCount)) return 0;
  return method === "express" ? STORE.expressShipping : STORE.standardShipping;
}

export function whatsappUrl(text: string) {
  return STORE.whatsapp ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}` : null;
}
