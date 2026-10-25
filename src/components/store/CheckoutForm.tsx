"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CartTotals } from "./CartLines";
import { PROVINCES, shippingFor } from "@/lib/config";
import { cartSubtotal, useCart, useMounted } from "@/lib/cart";
import { formatZAR } from "@/lib/money";

export default function CheckoutForm({ paymentLinkAvailable }: { paymentLinkAvailable: boolean }) {
  const router = useRouter();
  const mounted = useMounted();
  const { lines, clear } = useCart();
  const [method, setMethod] = useState<"eft" | "payment_link">("eft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!mounted) return <div className="h-64" />;
  if (lines.length === 0)
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium">Your bag is empty</p>
        <Link href="/shop" className="btn btn-primary mt-4">Shop collection</Link>
      </div>
    );

  const subtotal = cartSubtotal(lines);
  const total = subtotal + shippingFor(subtotal);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      clear();
      router.push(`/order/${data.reference}`);
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
          <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" className="field" /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="field" /></div>
            <div><label className="label" htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" required autoComplete="tel" className="field" /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-medium">Delivery address</h2>
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
          <h2 className="text-base font-medium">Payment</h2>
          <label className="card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-ink">
            <input type="radio" name="pm" checked={method === "eft"} onChange={() => setMethod("eft")} className="mt-1" />
            <span><span className="block text-sm font-medium">EFT / bank transfer</span><span className="text-sm text-muted">You&apos;ll see our bank details after you place the order. Upload your proof of payment on the order page.</span></span>
          </label>
          {paymentLinkAvailable && (
            <label className="card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-ink">
              <input type="radio" name="pm" checked={method === "payment_link"} onChange={() => setMethod("payment_link")} className="mt-1" />
              <span><span className="block text-sm font-medium">Pay online</span><span className="text-sm text-muted">Pay securely with our payment link after you place the order.</span></span>
            </label>
          )}
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <h2 className="text-base font-medium">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3"><span className="line-clamp-1">{l.qty} × {l.name}</span><span>{formatZAR(l.price * l.qty)}</span></li>
          ))}
        </ul>
        <CartTotals lines={lines} />
        {error && <p role="alert" className="rounded-xl bg-soft-pink px-3 py-2 text-sm text-deep-pink">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Placing order…" : `Place order · ${formatZAR(total)}`}</button>
        <p className="text-center text-xs text-muted">Final totals are confirmed by our server.</p>
      </aside>
    </form>
  );
}
