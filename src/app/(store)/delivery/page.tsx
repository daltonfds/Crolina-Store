import Link from "next/link";
import { STORE } from "@/lib/config";
import { formatZAR } from "@/lib/money";

export const metadata = { title: "Delivery information" };

export default function DeliveryPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Crolina · South Africa</p>
        <h1 className="text-3xl font-medium">Delivery information</h1>
        <p className="text-muted">Enjoy free delivery on every Crolina product throughout South Africa.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line p-5">
          <p className="text-sm font-medium text-muted">Express · 1–3 business days</p>
          <p className="mt-1 text-2xl font-medium">FREE</p>
          <p className="mt-2 text-sm text-muted">Estimated delivery after payment confirmation.</p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <p className="text-sm font-medium text-muted">Standard · 1–5 business days</p>
          <p className="mt-1 text-2xl font-medium">FREE</p>
          <p className="mt-2 text-sm text-muted">Estimated delivery after payment confirmation.</p>
        </div>
      </section>

      <section className="rounded-2xl bg-[#f0f7ff] p-5">
        <h2 className="text-lg font-medium text-[#1e4f9c]">Free delivery on every order</h2>
        <p className="mt-2 text-sm leading-6 text-[#1e4f9c]">Every product on Crolina includes free delivery throughout South Africa. No minimum spend and no minimum item quantity.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Delivery terms</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-ink/80">
          <li>Delivery is currently offered within South Africa.</li>
          <li>Business days exclude weekends and South African public holidays.</li>
          <li>Delivery estimates begin after payment has been confirmed and may vary by destination, stock availability, and circumstances outside our reasonable control.</li>
          <li>We will communicate material delivery delays and handle non-delivery in accordance with applicable South African law.</li>
          <li>Delivery charges are not refundable where the law permits them to be retained. This does not limit any statutory right to a refund of delivery charges or the full transaction amount.</li>
          <li>Where a return, collection, or replacement is required because goods are defective or we supplied the wrong item, Crolina will cover costs where required by law.</li>
        </ul>
      </section>

      <p className="text-sm text-muted">For return, cancellation, and refund conditions, read our <Link href="/returns" className="underline">Returns &amp; Refunds Policy</Link>.</p>
    </article>
  );
}
