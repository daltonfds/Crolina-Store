"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "crolina-cookies-accepted";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { setShow(true); }
  }, []);
  if (!show) return null;
  function accept() {
    try { localStorage.setItem(KEY, new Date().toISOString()); } catch { /* ignore */ }
    setShow(false);
  }
  return (
    <div role="dialog" aria-label="Cookie notice" className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg rounded-2xl border border-line bg-white p-4 shadow-lg md:bottom-4">
      <p className="text-sm">
        We use essential cookies and your browser storage to keep your bag, favorites and sign-in working. We don&apos;t use advertising cookies.
        Read our <Link href="/privacy" className="underline">Privacy policy</Link> and <Link href="/terms" className="underline">Terms</Link>.
      </p>
      <button onClick={accept} className="btn btn-primary mt-3 !h-10 w-full">Accept</button>
    </div>
  );
}