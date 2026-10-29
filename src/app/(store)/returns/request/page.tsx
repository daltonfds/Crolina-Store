import Link from "next/link";
import ReturnRequestForm from "@/components/store/ReturnRequestForm";
import { RETURNS } from "@/lib/returns";

export const metadata = { title: "Request a return, exchange or refund" };

export default async function ReturnRequestPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const order = ((await searchParams).order ?? "").toUpperCase().slice(0, 13);
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-medium">Return, exchange or refund</h1>
        <p className="mt-1 text-sm text-muted">Tell us what you need. Our team reviews every request and answers by email. The whole process usually takes around {RETURNS.processDays} days. Please do not send anything back before we approve your request.</p>
      </div>
      <ReturnRequestForm initialReference={/^CR-[A-F0-9]{10}$/.test(order) ? order : ""} />
      <p className="text-sm text-muted">Read our <Link href="/returns" className="underline">returns policy</Link>.</p>
    </div>
  );
}
