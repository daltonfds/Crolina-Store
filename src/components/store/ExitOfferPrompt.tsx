"use client";
import { useEffect, useRef, useState } from "react";
import { trackStoreEvent } from "./StoreAnalytics";

type Profile = { name?: string; email?: string; phone?: string };
const PROFILE_KEY = "crolina-contact-profile";

export default function ExitOfferPrompt() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const opened = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") as Profile;
      setName(saved.name || ""); setEmail(saved.email || ""); setWhatsapp(saved.phone || "");
    } catch {}
    const refreshProfile = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") as Profile;
        setName(saved.name || ""); setEmail(saved.email || ""); setWhatsapp(saved.phone || "");
      } catch {}
    };
    window.addEventListener("crolina-contact-updated", refreshProfile);
    const show = () => {
      if (opened.current || sessionStorage.getItem("crolina-exit-prompt-shown")) return;
      opened.current = true;
      sessionStorage.setItem("crolina-exit-prompt-shown", "1");
      setOpen(true);
      trackStoreEvent("exit_prompt_opened");
    };
    const mouse = (e: MouseEvent) => { if (e.clientY <= 4 && e.relatedTarget === null) show(); };
    const timer = window.setTimeout(() => {
      if (window.innerWidth < 768) show();
    }, 45000);
    document.addEventListener("mouseout", mouse);
    return () => {
      document.removeEventListener("mouseout", mouse);
      window.removeEventListener("crolina-contact-updated", refreshProfile);
      window.clearTimeout(timer);
    };
  }, []);

  if (!open) return null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setMessage("Please tick the box to agree to receive product and offer updates."); return; }
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/marketing-contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, whatsapp, source: "exit_prompt", marketing_consent: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your details.");
      const saved = { name, email, phone: whatsapp };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(saved));
      setMessage("You're on the list! We'll share relevant product updates and offers.");
      setTimeout(() => setOpen(false), 1800);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="exit-offer-title">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted">Before you go</p><h2 id="exit-offer-title" className="mt-1 text-lg font-medium">Get product updates & special offers</h2><p className="mt-2 text-sm text-muted">Leave your details and we’ll let you know when products return or new offers arrive.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-xl text-muted">×</button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div><label className="label" htmlFor="exit-name">Name</label><input id="exit-name" className="field" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={120} /></div>
          <div><label className="label" htmlFor="exit-email">Email</label><input id="exit-email" className="field" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={200} /></div>
          <div><label className="label" htmlFor="exit-whatsapp">WhatsApp</label><input id="exit-whatsapp" className="field" type="tel" autoComplete="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} maxLength={30} /></div>
          <label className="flex items-start gap-2 text-xs text-muted"><input type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I agree to receive product updates and offers by email or WhatsApp. You can ask us to stop sending updates at any time.</span></label>
          {message && <p role="status" className="text-sm text-muted">{message}</p>}
          <button disabled={busy} className="btn btn-primary w-full">{busy ? "Saving..." : "Keep me updated"}</button>
          <button type="button" onClick={() => setOpen(false)} className="w-full py-2 text-sm text-muted underline">No thanks</button>
        </form>
      </div>
    </div>
  );
}
