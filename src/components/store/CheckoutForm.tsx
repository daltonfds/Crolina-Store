"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartTotals } from "./CartLines";
import PaymentMethodLogos from "./PaymentMethodLogos";
import { PROVINCES, STORE, qualifiesForFreeShipping, shippingFor, type DeliveryMethod } from "@/lib/config";
import { cartCount, cartSubtotal, useCart, useMounted } from "@/lib/cart";
import { formatZAR } from "@/lib/money";

export default function CheckoutForm({ storeLinkAvailable }: { storeLinkAvailable: boolean }) {
  const router = useRouter();
  const mounted = useMounted();
  const { lines, clear } = useCart();
  const [choice, setChoice] = useState<"eft" | "payment_link">("eft");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("crolina-contact-profile") || "{}");
      setContact({ name: saved.name || "", email: saved.email || "", phone: saved.phone || "" });
    } catch { /* ignore invalid local profile */ }
  }, []);

  function updateContact(field: "name" | "email" | "phone", value: string) {
    const next = { ...contact, [field]: value };
    setContact(next);
    try { localStorage.setItem("crolina-contact-profile", JSON.stringify(next)); } catch { /* ignore storage restrictions */ }
  }

  if (!mounted) return <div className="h-64" />;
  if (lines.length === 0)
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium">Your bag is empty</p>
        <Link href="/shop" className="btn btn-primary mt-4">Shop collection</Link>
      </div>
    );

  // A payment link is available when the store has a default link, or the bag holds a single product that has its own link.
  const specialR900Link = lines.length === 1 && lines[0].qty === 1 && lines[0].price === 900;
  const linkOk = specialR900Link || storeLinkAvailable || (lines.length === 1 && !!lines[0].link);
  const method = choice === "payment_link" && linkOk ? "payment_link" : "eft";
  const subtotal = cartSubtotal(lines);
  const itemCount = cartCount(lines);
  const freeDelivery = qualifiesForFreeShipping(subtotal, itemCount);
  const deliveryFee = shippingFor(subtotal, itemCount, deliveryMethod);
  const total = subtotal + deliveryFee;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepted) { setError("Please accept the Terms, Privacy policy and Returns & warranty to continue."); return; }
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          customer: { name: v("name"), email: v("email"), phone: v("phone") },
          address: { street: v("street"), suburb: v("suburb"), city: v("city"), province: v("province"), postal_code: v("postal_code") },
          notes: v("notes"),
          payment_method: method,
          delivery_method: deliveryMethod,
          accepted: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      clear();
      router.push(`/order/${data.reference}${data.paymentUrl ? "?pay=1" : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 md:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-base font-medium">Contact</h2>
          <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" className="field" value={contact.name} onChange={e => updateContact("name", e.target.value)} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="field" value={contact.email} onChange={e => updateContact("email", e.target.value)} /></div>
            <div><label className="label" htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" required autoComplete="tel" className="field" value={contact.phone} onChange={e => updateContact("phone", e.target.value)} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-medium">Delivery address</h2>
          <p className="text-sm text-muted">Nationwide delivery in {deliveryMethod === "express" ? "1–3 business days" : "1–5 business days"}, after your payment is confirmed.</p>
          <div><label className="label" htmlFor="street">Street address</label><input id="street" name="street" required autoComplete="street-address" className="field" /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="label" htmlFor="suburb">Suburb</label><input id="suburb" name="suburb" className="field" /></div>
            <div><label className="label" htmlFor="city">City</label><input id="city" name="city" required className="field" /></div>
            <div>
              <label className="label" htmlFor="province">Province</label>
              <select id="province" name="province" required defaultValue="" className="field">
                <option value="" disabled>Select province</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="postal_code">Postal code</label><input id="postal_code" name="postal_code" required inputMode="numeric" pattern="\d{4}" maxLength={4} className="field" /></div>
          </div>
          <div><label className="label" htmlFor="notes">Delivery notes (optional)</label><textarea id="notes" name="notes" rows={2} maxLength={500} className="field" /></div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium">Delivery method</h2>
            <Link href="/delivery" target="_blank" className="text-sm underline">Delivery information</Link>
          </div>
          {freeDelivery && <p className="rounded-xl bg-[#f0f7ff] px-3 py-2 text-sm text-[#1e4f9c]">Your order qualifies for free delivery after discounts.</p>}
          <label className="card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-ink">
            <input type="radio" name="delivery_method" checked={deliveryMethod === "standard"} onChange={() => setDeliveryMethod("standard")} className="mt-1" />
            <span className="flex-1"><span className="block text-sm font-medium">Standard</span><span className="block text-sm text-muted">1–5 business days</span><span className="text-sm text-muted">{freeDelivery ? "FREE" : formatZAR(STORE.standardShipping)}</span></span>
          </label>
          <label className="card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-ink">
            <input type="radio" name="delivery_method" checked={deliveryMethod === "express"} onChange={() => setDeliveryMethod("express")} className="mt-1" />
            <span className="flex-1"><span className="block text-sm font-medium">Express</span><span className="block text-sm text-muted">1–3 business days</span><span className="text-sm text-muted">{freeDelivery ? "FREE" : formatZAR(STORE.expressShipping)}</span></span>
          </label>
          <p className="text-xs text-muted">Free delivery applies when your order contains 5 or more eligible items OR the product subtotal after discounts is R2,500 or more.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-medium">Payment</h2>
          <label className="card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-ink">
            <input type="radio" name="pm" checked={method === "eft"} onChange={() => setChoice("eft")} className="mt-1" />
            <span><span className="block text-sm font-medium">EFT / bank transfer</span><span className="text-sm text-muted">You&apos;ll see our bank details after you place the order. Then upload your proof of payment (photo or document).</span></span>
          </label>
          <label className={`card flex items-start gap-3 p-4 has-[:checked]:border-ink ${linkOk ? "cursor-pointer" : "opacity-50"}`}>
            <input type="radio" name="pm" disabled={!linkOk} checked={method === "payment_link"} onChange={() => setChoice("payment_link")} className="mt-1" />
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Payment link</span>
              <span className="text-sm text-muted">
                {linkOk
                  ? "Pay securely through the payment link. Available methods depend on the payment provider."
                  : "Not available for the items in your bag. Choose EFT or order via WhatsApp."}
              </span>
              {linkOk && <PaymentMethodLogos />}
            </div>
          </label>
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <h2 className="text-base font-medium">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3"><span className="line-clamp-1">{l.qty} × {l.name}</span><span>{formatZAR(l.price * l.qty)}</span></li>
          ))}
        </ul>
        <CartTotals lines={lines} deliveryMethod={deliveryMethod} />
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" required checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
          <span>
            I have read and accept the <Link href="/terms" target="_blank" className="underline">Terms of sale</Link>,{" "}
            <Link href="/privacy" target="_blank" className="underline">Privacy policy</Link> and{" "}
            <Link href="/returns" target="_blank" className="underline">Returns &amp; warranty</Link>.
          </span>
        </label>
        {error && <p role="alert" className="rounded-xl bg-soft-pink px-3 py-2 text-sm text-deep-pink">{error}</p>}
        <button type="submit" disabled={busy || !accepted} className="btn btn-primary w-full">{busy ? "Placing order…" : `Confirm order · ${formatZAR(total)}`}</button>
        <p className="text-center text-xs text-muted">Final totals are confirmed by our server.</p>
      </aside>
    </form>
  );
}