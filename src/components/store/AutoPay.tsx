"use client";
import { useEffect } from "react";

export default function AutoPay({ url }: { url: string }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.assign(url), 3000);
    return () => clearTimeout(t);
  }, [url]);
  return (
    <section className="card space-y-3 bg-soft-blue p-5 text-center">
      <p className="text-base font-medium">Taking you to the secure payment page…</p>
      <p className="text-sm text-ink/70">Keep your order reference handy. We&apos;ll also keep this page for you.</p>
      <a href={url} className="btn btn-primary">Continue to payment</a>
    </section>
  );
}