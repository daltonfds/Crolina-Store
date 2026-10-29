"use client";

import { useState, type FormEvent } from "react";

export default function AffiliateApplyPage() {
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/affiliates", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:form.get("name"),email:form.get("email"),phone:form.get("phone")})});
      const data = await response.json();
      setError(!response.ok); setMessage(data.message || data.error || "Please try again.");
      if(response.ok) event.currentTarget.reset();
    } catch { setError(true); setMessage("Connection error. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10 text-neutral-900"><div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-neutral-500">Crolina Shop</p><h1 className="mt-3 text-3xl font-semibold">Become an affiliate</h1><p className="mt-3 text-sm leading-6 text-neutral-600">Recommend products, share your unique referral link after approval, and track eligible sales. Applications are reviewed before activation.</p><form className="mt-7 space-y-4" onSubmit={submit}><label className="block text-sm font-medium">Full name<input required name="name" autoComplete="name" className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"/></label><label className="block text-sm font-medium">Email address<input required name="email" type="email" autoComplete="email" className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"/></label><label className="block text-sm font-medium">WhatsApp number (optional)<input name="phone" type="tel" autoComplete="tel" className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"/></label><button disabled={busy} className="w-full rounded-full bg-neutral-900 px-5 py-3.5 font-medium text-white disabled:opacity-50">{busy?"Submitting…":"Apply to become an affiliate"}</button>{message&&<p role="status" className={`rounded-xl p-3 text-sm ${error?"bg-red-50 text-red-700":"bg-green-50 text-green-800"}`}>{message}</p>}</form></div></main>;
}
