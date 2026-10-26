import { notFound } from "next/navigation";
import { STORE } from "@/lib/config";

type Section = { h?: string; p: string };

const PAGES: Record<string, { title: string; sections: Section[] }> = {
  returns: {
    title: "Returns & warranty",
    sections: [
      { h: "Time limit", p: "Contact us within 7 days of receiving your order, on WhatsApp or at support@crolina.shop. Always include your order reference and, where relevant, clear photos." },
      { h: "Returning an item", p: "Items must be unused and in their original packaging. If we approve the return, we refund 50% of the price paid for the returned item. Delivery fees are not refunded." },
      { h: "Item arrives damaged or destroyed", p: "Send us photos within 7 days of delivery. After assessment, we refund 50% of the price paid for the damaged item." },
      { h: "Wrong item sent", p: "If we send the wrong item, we deduct the value of the item we sent plus the delivery fee from the amount you paid, and refund the remaining balance." },
      { h: "How refunds are paid", p: "Approved refunds are paid by EFT to the bank account you give us, after we have received and assessed the item or photos." },
      { h: "Your legal rights", p: "Nothing in this policy limits the rights you have under the Consumer Protection Act and the Electronic Communications and Transactions Act." },
    ],
  },
  privacy: {
    title: "Privacy",
    sections: [
      { h: "What we collect", p: "Only what we need to process your order: your name, email, phone number, delivery address and, if you upload it, your proof of payment." },
      { h: "How we use it", p: "To confirm payment, deliver your order and contact you about it. We do not sell your information." },
      { h: "Cookies and browser storage", p: "We use essential cookies and your browser's local storage to keep your bag, your favorites and, for staff, the admin sign-in working. We do not use advertising cookies." },
      { h: "Proof of payment", p: "Payment proofs are stored privately and are only visible to Crolina staff." },
      { h: "Your rights", p: `To see, correct or delete your information, email ${STORE.email}.` },
    ],
  },
  terms: {
    title: "Terms of sale",
    sections: [
      { h: "Prices and payment", p: "All prices are in South African Rand (ZAR). You can pay by EFT or through a payment link. An order is confirmed once we have verified your payment." },
      { h: "Delivery", p: `We deliver nationwide in ${STORE.deliveryTime} after your payment is confirmed. Delivery is free over R ${STORE.freeShippingOver}, otherwise a flat R ${STORE.shippingFlat}.` },
      { h: "Stock", p: "Stock is reserved when you place an order. Unpaid orders may be cancelled and the stock released." },
      { h: "Returns and refunds", p: "See our Returns & warranty policy. By placing an order you confirm that you have read and accepted it, together with these Terms and our Privacy policy." },
      { h: "Contact", p: `Questions? Email ${STORE.email} or message us on WhatsApp.` },
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
      <div className="mt-5 space-y-5">
        {page.sections.map((s) => (
          <section key={s.h}>
            {s.h && <h2 className="text-base font-medium">{s.h}</h2>}
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}