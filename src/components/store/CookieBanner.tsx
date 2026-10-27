"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackStoreEvent } from "./StoreAnalytics";

const KEY = "crolina-cookies-accepted";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [updates, setUpdates] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
      const profile = JSON.parse(localStorage.getItem("crolina-contact-profile") || "{}");
      if (profile.email) setEmail(profile.email);
    } catch { setShow(true); }
  }, []);
  if (!show) return null;

  async function accept() {
    setBusy(true);
    try {
      localStorage.setItem(KEY, new Date().toISOString());
      trackStoreEvent("cookie_accepted");
      if (email.trim()) {
        try {
          const saved = JSON.parse(localStorage.getItem("crolina-contact-profile") || "{}");
          localStorage.setItem("crolina-contact-profile", JSON.stringify({ ...saved, email: email.trim() }));
          window.dispatchEvent(new Event("crolina-contact-updated"));
        } catch { /* email can still be submitted even if storage is unavailable */ }
        await fetch("/api/marketing-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: (() => { try { return JSON.parse(localStorage.getItem("crolina-contact-profile") || "{}").name || "Store visitor"; } catch { return "Store visitor"; } })(),
            email: email.trim(),
            source: "cookie_consent",
            marketing_consent: updates,
          }),
        }).catch(() => undefined);
      }
    } finally {
      setBusy(false);
      setShow(false);
    }
  }

  return (
    <div role="dialog" aria-label="Cookie notice" className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg rounded-2xl border border-line bg-white p-4 shadow-lg md:bottom-4">
      <p className="text-sm">
        We use essential cookies and browser storage to keep your bag, favorites and sign-in working. We don&apos;t use advertising cookies.
        Read our <Link href="/privacy" className="underline">Privacy policy</Link> and <Link href="/terms" className="underline">Terms</Link>.
      </p>
      <div className="mt-3">
        <label className="label" htmlFor="cookie-email">Email (optional)</label>
        <input id="cookie-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" className="mt-0.5" checked={updates} onChange={e => setUpdates(e.target.checked)} />
        <span>Also send me product updates and special offers by email. Optional; I can unsubscribe anytime.</span>
      </label>
      <button disabled={busy} onClick={accept} className="btn btn-primary mt-3 !h-10 w-full">{busy ? "Saving..." : "Accept cookies"}</button>
    </div>
  );
}
