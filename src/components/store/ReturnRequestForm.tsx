"use client";
import Link from "next/link";
import { useState } from "react";
import { REASONS, REQUEST_TYPES, RETURNS } from "@/lib/returns";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; quantity: number };

export default function ReturnRequestForm({ initialReference = "" }: { initialReference?: string }) {
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [type, setType] = useState("refund");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [exchange, setExchange] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ reference: string; token: string } | null>(null);

  const needsPhoto = REASONS.find((r) => r.value === reason)?.photo ?? false;

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/returns/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, email }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong.");
    setItems(data.items);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const chosen = Object.entries(picked).filter(([, q]) => q > 0).map(([id, quantity]) => ({ id, quantity }));
    if (chosen.length === 0) return setError("Select the item(s) this request is about.");
    if (!reason) return setError("Choose a reason.");
    if (needsPhoto && files.length === 0) return setError("Please attach at least one photo of the problem.");
    if (!consent) return setError("Please confirm that you have read the returns policy.");
    setBusy(true);
    const fd = new FormData();
    fd.set("reference", reference); fd.set("email", email); fd.set("type", type); fd.set("reason", reason);
    fd.set("details", details); fd.set("exchange_preference", exchange); fd.set("items", JSON.stringify(chosen)); fd.set("consent", "1");
    files.forEach((f) => fd.append("photos", f));
    const res = await fetch("/api/returns", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong.");
    setDone(data);
  }

  if (done)
    return (
      <div className="card space-y-3 p-6">
        <h2 className="text-xl font-medium">Request received</h2>
        <p className="text-sm">Your request number is <b>{done.reference}</b>. We sent a confirmation to your email.</p>
        <p className="text-sm text-muted">Our team reviews and approves every request before anything happens. Please do not send anything back until we approve it. The whole process usually takes around {RETURNS.processDays} days, and we update you by email at each step.</p>
        <Link href={`/returns/status/${done.reference}?t=${done.token}`} className="btn btn-primary w-full">View my request</Link>
      </div>
    );

  if (!items)
    return (
      <form onSubmit={lookup} className="card space-y-4 p-5">
        <div><label className="label" htmlFor="ref">Order reference</label><input id="ref" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} placeholder="CR-XXXXXXXXXX" className="field" required /></div>
        <div><label className="label" htmlFor="em">Email used at checkout</label><input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required /></div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Checking…" : "Find my order"}</button>
      </form>
    );

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="card space-y-3 p-5">
        <h2 className="text-base font-medium">1. Which item(s)?</h2>
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 text-sm">
            <label className="flex flex-1 items-start gap-3">
              <input type="checkbox" className="mt-0.5 h-5 w-5 accent-black" checked={(picked[i.id] ?? 0) > 0} onChange={(e) => setPicked((p) => ({ ...p, [i.id]: e.target.checked ? 1 : 0 }))} />
              <span>{i.name}</span>
            </label>
            {i.quantity > 1 && (picked[i.id] ?? 0) > 0 && (
              <select value={picked[i.id]} onChange={(e) => setPicked((p) => ({ ...p, [i.id]: Number(e.target.value) }))} className="field h-10 w-20">
                {Array.from({ length: i.quantity }, (_, n) => n + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            )}
          </div>
        ))}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-medium">2. What do you need?</h2>
        {REQUEST_TYPES.map((t) => (
          <label key={t.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm", type === t.value ? "border-ink" : "border-line")}>
            <input type="radio" name="type" checked={type === t.value} onChange={() => setType(t.value)} className="accent-black" />{t.label}
          </label>
        ))}
        {type === "exchange" && (
          <div><label className="label" htmlFor="ex">What would you like instead?</label><input id="ex" value={exchange} onChange={(e) => setExchange(e.target.value)} maxLength={300} className="field" /></div>
        )}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-medium">3. What happened?</h2>
        <div>
          <label className="label" htmlFor="reason">Reason</label>
          <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="field">
            <option value="">Select a reason</option>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="det">Tell us more</label><textarea id="det" value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={1500} className="field h-auto py-3" /></div>
        <div>
          <label className="label" htmlFor="ph">Photos {needsPhoto ? "(required)" : "(optional)"}</label>
          <input id="ph" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, RETURNS.maxPhotos))} className="block w-full text-sm" />
          <p className="mt-1 text-xs text-muted">Up to {RETURNS.maxPhotos} photos, 4 MB each. Show the item and the packaging.</p>
        </div>
      </section>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-black" />
        <span>I have read the <Link href="/returns" target="_blank" className="underline">Returns, refunds &amp; warranty</Link> policy. I understand that my request must be approved before I send anything back.</span>
      </label>
      {error && <p role="alert" className="rounded-xl border border-danger/30 px-3 py-2 text-sm text-danger">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Submit request"}</button>
    </form>
  );
}
