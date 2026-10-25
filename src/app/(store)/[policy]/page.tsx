import { notFound } from "next/navigation";
import { STORE } from "@/lib/config";

const PAGES: Record<string, { title: string; body: string[] }> = {
  returns: {
    title: "Returns & warranty",
    body: [
      "If your item arrives incorrect, damaged or faulty, contact us within 7 days of delivery with your order reference and photos.",
      "Returns are assessed case by case and are subject to the Consumer Protection Act and other applicable South African law.",
      "Items must be unused and in their original packaging unless the problem is a defect. Approved refunds are paid to the original payment method.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "We collect only what we need to process your order: your name, email, phone number and delivery address.",
      "Your details are used to confirm payment, deliver your order and contact you about it. We do not sell your information.",
      "Payment proofs are stored privately and are only visible to Crolina staff. To access or delete your information, contact us.",
    ],
  },
  terms: {
    title: "Terms of sale",
    body: [
      "Prices are in South African Rand (ZAR). An order is confirmed once we have verified your payment.",
      "Delivery is within South Africa. Delivery fees and timing are shown at checkout and confirmed after payment.",
      "Stock is reserved when you place an order. Unpaid orders may be cancelled and the stock released.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((policy) => ({ policy }));
}

export default async function Policy({ params }: { params: Promise<{ policy: string }> }) {
  const page = PAGES[(await params).policy];
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-medium">{page.title}</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
        {page.body.map((t) => <p key={t}>{t}</p>)}
        <p className="text-muted">Questions? Contact {STORE.name} on WhatsApp or by email. This page is a summary and should be reviewed against your own legal requirements.</p>
      </div>
    </article>
  );
}
