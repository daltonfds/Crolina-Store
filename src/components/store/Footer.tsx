import Link from "next/link";
import SocialLinks from "./SocialLinks";
import { STORE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div>
          <p className="text-lg font-medium">{STORE.name}</p>
          <p className="text-sm text-muted">{STORE.tagline}</p>
          <p className="mt-1 text-sm text-muted">Nationwide delivery in {STORE.deliveryTime}.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Follow and contact us</p>
          <SocialLinks />
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/shop">Shop</Link>
          <Link href="/account">Track an order</Link>
          <Link href="/delivery">Delivery information</Link>
          <Link href="/returns">Returns &amp; refunds</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p className="text-xs text-muted">© {new Date().getFullYear()} {STORE.name}. All prices in ZAR.</p>
      </div>
    </footer>
  );
}