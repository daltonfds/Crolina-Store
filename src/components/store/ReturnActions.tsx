"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROVINCES, STORE } from "@/lib/config";

type Addr = Record<string, string>;

export default function ReturnActions({ reference, token, status, initialAddress, phone }: { reference: string; token: string; status: string; initialAddress: Addr; phone: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<"" | "collection" | "send_back">("");
  const [a, setA] = useState<Addr>({ street: initialAddress.street ?? "", suburb: initialAddress.suburb ?? "", city: initialAddress.city ?? "", province: initialAddress.province ?? "", postal_code: initialAddress.postal_code ?? "", phone });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setA((p) => ({ ...p, [k]: v }));

  async function post(path: string, body: object) {
    setBusy(true); setError("");
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, token, ...body }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {status === "approved" && (
        <section className="card space-y-3 p-5">
          <h2 className="text-base font-medium">How will the item get back to us?</h2>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm has-[:checked]:border-ink">
            <input type="radio" name="m" className="mt-1 accent-black" checked={method === "collection"} onChange={() => setMethod("collection")} />
            <span><b>Collection</b><br /><span className="text-muted">We collect it from your address. We email you the collection date.</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm has-[:checked]:border-ink">
            <input type="radio" name="m" className="mt-1 accent-black" checked={method === "send_back"} onChange={() => setMethod("send_back")} />
            <span><b>I send it back to Crolina</b><br /><span className="text-muted">We email you our return address and what to include in the parcel.</span></span>
          </label>
          {method === "collection" && (
            <div className="space-y-3">
              <input className="field" placeholder="Street address" value={a.street} onChange={(e) => set("street", e.target.value)} />
              <input className="field" placeholder="Suburb" value={a.suburb} onChange={(e) => set("suburb", e.target.value)} />
              <input className="field" placeholder="City" value={a.city} onChange={(e) => set("city", e.target.value)} />
              <select className="field" value={a.province} onChange={(e) => set("province", e.target.value)}><option value="">Province</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
              <input className="field" placeholder="Postal code" inputMode="numeric" maxLength={4} value={a.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
              <input className="field" placeholder="Phone number" inputMode="tel" value={a.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          )}
          <button className="btn btn-primary w-full" disabled={!method || busy} onClick={() => post("/api/returns/method", { method, address: a })}>{busy ? "Saving…" : "Confirm"}</button>
        </section>
      )}
      {["submitted", "under_review", "info_requested", "approved"].includes(status) && (
        <button className="text-sm text-muted underline" disabled={busy} onClick={() => confirm("Cancel this request?") && post("/api/returns/cancel", {})}>Cancel this request</button>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-muted">Questions? Reply to any email from us, or write to {STORE.email}.</p>
    </div>
  );
}
