"use client";
import { WhatsAppIcon } from "./SocialLinks";
import { STORE, whatsappUrl } from "@/lib/config";
import { cartSubtotal, useCart, useMounted } from "@/lib/cart";
import { formatZAR } from "@/lib/money";
import { unitPriceFor } from "@/lib/pricing";

export function WhatsAppCartButton() {
  const mounted = useMounted();
  const lines = useCart((s) => s.lines);
  if (!mounted || lines.length === 0 || !STORE.whatsapp) return null;
  const list = lines.map((l) => `• ${l.qty} × ${l.name} — ${formatZAR(unitPriceFor(l.price, l.qty, { b3: l.b3, b6: l.b6 }))} each`).join("\n");
  const msg = `Hi Crolina! I'd like to order:\n\n${list}\n\nItems total: ${formatZAR(cartSubtotal(lines))} (delivery not included)\n\nPlease confirm availability and payment details.`;
  return (
    <a href={whatsappUrl(msg)!} target="_blank" rel="noreferrer" className="btn btn-outline w-full">
      <WhatsAppIcon size={20} className="text-[#1fa855]" /> Order via WhatsApp
    </a>
  );
}