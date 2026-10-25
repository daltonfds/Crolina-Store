export const STORE = {
  name: "Crolina",
  tagline: "Essential goods | South Africa",
  url: process.env.NEXT_PUBLIC_STORE_URL || "https://www.crolina.shop",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  shippingFlat: 60,
  freeShippingOver: 800,
  lowStock: 3,
};

export const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
] as const;

export const CATEGORY_SUGGESTIONS = ["Women", "Men", "Accessories", "Home", "Beauty", "Essentials"];

export function shippingFor(subtotal: number) {
  return subtotal <= 0 || subtotal >= STORE.freeShippingOver ? 0 : STORE.shippingFlat;
}

export function whatsappUrl(text: string) {
  return STORE.whatsapp ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}` : null;
}
