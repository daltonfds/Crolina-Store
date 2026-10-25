import Link from "next/link";
import { STORE, whatsappUrl } from "@/lib/config";

export default function Footer() {
  const wa = whatsappUrl("Hi Crolina, I have a question.");
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-lg font-medium">{STORE.name}</p>
        <p className="text-sm text-muted">{STORE.tagline}</p>
        <nav className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/shop">Shop</Link>
          <Link href="/account">Track an order</Link>
          <Link href="/returns">Returns &amp; warranty</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          {wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
        </nav>
        <p className="mt-6 text-xs text-muted">© {new Date().getFullYear()} {STORE.name}. All prices in ZAR.</p>
      </div>
    </footer>
  );
}
