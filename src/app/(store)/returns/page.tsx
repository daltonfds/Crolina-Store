import Link from "next/link";

export const metadata = { title: "Returns, refunds & warranty" };

export default function ReturnsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Crolina · South Africa</p>
        <h1 className="text-3xl font-medium">Returns, refunds &amp; warranty</h1>
        <p className="text-muted">We handle cancellations, returns, defective goods, and incorrect orders in line with applicable South African consumer protection law.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">1. Report a problem</h2>
        <p className="text-sm leading-6 text-ink/80">Contact us as soon as reasonably possible if an order is damaged, defective, incomplete, not delivered, or different from what you ordered. Include your order reference and, where helpful, photos of the item and packaging. Any request to contact us promptly is for efficient assistance and does not shorten statutory rights or time limits.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">2. Eligible online order cancellations</h2>
        <p className="text-sm leading-6 text-ink/80">Under section 44 of the Electronic Communications and Transactions Act 25 of 2002 (ECTA), a consumer may cancel a qualifying electronic transaction within seven days after receiving the goods, without reason or penalty, subject to the statutory exceptions. Where this right applies, refunds and any permitted deduction for the direct cost of returning the goods will be handled as required by law. This seven-day cooling-off right does not apply to every product or transaction.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">3. Defective, unsafe, or damaged goods</h2>
        <p className="text-sm leading-6 text-ink/80">Section 56 of the Consumer Protection Act 68 of 2008 (CPA) generally allows eligible goods to be returned within six months after delivery if they fail to meet the statutory quality requirements. Depending on the circumstances and the applicable legal remedy, the consumer may choose repair, replacement, or a refund. Returns under this protection are at the supplier's risk and expense, without penalty to the consumer.</p>
        <p className="text-sm leading-6 text-ink/80">Crolina will not apply a blanket 50% refund to goods where the law entitles the consumer to a full refund, replacement, or repair.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">4. Incorrect or incomplete orders</h2>
        <p className="text-sm leading-6 text-ink/80">If we supply the wrong item or omit an item, contact us so we can verify the order and arrange an appropriate remedy, which may include delivery of the correct item, collection or replacement, or a refund as required by law. We will not deduct the value of an item sent by our mistake or charge the customer delivery or return costs where the law requires us to bear them.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">5. Change of mind outside a statutory cooling-off right</h2>
        <p className="text-sm leading-6 text-ink/80">If no statutory cancellation or return right applies, a change-of-mind return is subject to any applicable terms disclosed before purchase and to all non-excludable consumer rights. Nothing in this policy guarantees a change-of-mind return where the law does not require one.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">6. Delivery charges and refunds</h2>
        <p className="text-sm leading-6 text-ink/80">Delivery charges are non-refundable only where permitted by law. Where legislation requires a refund of all payments, including delivery charges, or requires Crolina to pay return or collection costs, we will comply. No term in this policy limits the customer's statutory rights.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">7. Refund processing</h2>
        <p className="text-sm leading-6 text-ink/80">We will process approved refunds within the period required by applicable law and, where reasonably possible and legally permitted, use the original payment method. We will contact you if information is needed to complete the refund.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">8. Your statutory rights</h2>
        <p className="text-sm leading-6 text-ink/80">Nothing in this policy excludes, restricts, or waives a right or remedy that cannot lawfully be excluded or restricted under South African law, including the Consumer Protection Act 68 of 2008 and the Electronic Communications and Transactions Act 25 of 2002. The policy must be interpreted consistently with those laws and any other applicable legislation.</p>
      </section>

      <p className="text-sm text-muted">For shipping prices and free-delivery eligibility, see our <Link href="/delivery" className="underline">Delivery Information</Link> page.</p>
    </article>
  );
}
