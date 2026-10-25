import Link from "next/link";
import TrackForm from "@/components/store/TrackForm";
import { whatsappUrl } from "@/lib/config";

export const metadata = { title: "Account" };

export default function Account() {
  const wa = whatsappUrl("Hi Crolina, I need help with my order.");
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-medium">Account</h1>
      <section className="card space-y-3 p-5">
        <h2 className="text-base font-medium">Track an order</h2>
        <p className="text-sm text-muted">Enter the reference from your confirmation email. You can also upload your proof of payment from the order page.</p>
        <TrackForm />
      </section>
      <section className="card divide-y divide-line text-sm">
        <Link href="/favorites" className="block p-4">Favorites</Link>
        <Link href="/returns" className="block p-4">Returns &amp; warranty</Link>
        <Link href="/privacy" className="block p-4">Privacy</Link>
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="block p-4">Chat on WhatsApp</a>}
      </section>
    </div>
  );
}
