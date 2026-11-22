"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { formatMoney, type FunnelConfig } from "@/lib/banca";

type Props = { config: FunnelConfig; slug: string; testimonials?: string[] };

type Stage = "product" | "cart" | "checkout";

export default function BancaProductPage({ config: C, slug, testimonials = [] }: Props) {
  const [stage, setStage] = useState<Stage>("product");
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [payment, setPayment] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const images = C.imgs ?? [];
  const total = useMemo(() => C.price * quantity, [C.price, quantity]);
  const methods = [
    ...(C.pay.cod && C.kind === "fisico" ? [{ id: "cod", label: "Pagamento na entrega" }] : []),
    ...(C.pay.mpesa ? [{ id: "mpesa", label: "M-Pesa" }] : []),
    ...(C.pay.emola ? [{ id: "emola", label: "e-Mola" }] : []),
    ...(C.pay.mkesh ? [{ id: "mkesh", label: "mKesh" }] : []),
    ...(C.pay.bank ? [{ id: "bank", label: "Transferência bancária" }] : []),
  ];
  const theme = { "--product-ink": C.color || "#111827" } as CSSProperties;
  const goCheckout = () => {
    setError("");
    if (!quantity || quantity < 1) return;
    setStage("checkout");
  };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || (C.kind === "fisico" && !city.trim()) || (methods.length && !payment)) {
      setError("Preenche os campos obrigatórios para continuar.");
      return;
    }
    setBusy(true);
    const answers = [
      `Quantidade: ${quantity}`,
      `Pagamento: ${methods.find((m) => m.id === payment)?.label ?? "A combinar"}`,
      ...(notes.trim() ? [`Observações: ${notes.trim()}`] : []),
    ];
    const message = [
      `Olá! Quero encomendar ${C.name}.`,
      `Quantidade: ${quantity}`,
      `Total: ${formatMoney(total, C.currency ?? "MZN")}`,
      `Nome: ${name.trim()}`,
      `WhatsApp: ${phone.trim()}`,
      ...(city.trim() ? [`Cidade: ${city.trim()}`] : []),
      ...(payment ? [`Pagamento: ${methods.find((m) => m.id === payment)?.label}`] : []),
      ...(notes.trim() ? [`Observações: ${notes.trim()}`] : []),
    ].join("\n");
    try {
      const response = await fetch("/api/banca/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug, name: name.trim(), city: city.trim() || undefined, phone: phone.trim(),
          product: `${C.name} × ${quantity}`, price: total, currency: C.currency ?? "MZN", answers,
        }),
      });
      if (!response.ok) throw new Error("Não foi possível registar a encomenda. Tenta novamente.");
      window.location.href = `https://wa.me/${C.wa.replace(/\\D/g, "")}?text=${encodeURIComponent(message)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro. Tenta novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-white text-slate-900" style={theme}>
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href={`/f/${slug}`} className="text-sm font-semibold text-slate-700">← Voltar ao assistente</a>
          <span className="font-semibold tracking-tight">{C.brand}</span>
          <button type="button" onClick={() => setStage("cart")} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">
            Carrinho ({quantity})
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {stage === "product" && (
          <>
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              <section>
                <div className="overflow-hidden rounded-2xl bg-slate-50">
                  {images[photo] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[photo]} alt={C.name} className="aspect-square w-full object-contain" />
                  ) : <div className="grid aspect-square place-items-center text-sm text-slate-400">Sem fotografia disponível</div>}
                </div>
                {images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {images.slice(0, 10).map((src, i) => (
                    <button type="button" key={src + i} onClick={() => setPhoto(i)} aria-label={`Ver fotografia ${i + 1}`} className={`overflow-hidden rounded-lg border-2 ${photo === i ? "border-slate-900" : "border-transparent"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>}
              </section>

              <section className="flex flex-col items-start">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{C.brand}</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{C.name}</h1>
                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl font-bold">{formatMoney(C.price, C.currency ?? "MZN")}</span>
                  {C.old > C.price && <span className="text-lg text-slate-400 line-through">{formatMoney(C.old, C.currency ?? "MZN")}</span>}
                </div>
                {C.ben.length > 0 && <div className="mt-7 w-full">
                  <h2 className="mb-3 text-lg font-semibold">Benefícios</h2>
                  <ul className="space-y-3">{C.ben.map((benefit) => <li key={benefit} className="flex gap-3 text-[15px] leading-relaxed"><span className="font-bold text-emerald-600">✓</span><span>{benefit}</span></li>)}</ul>
                </div>}
                <div className="mt-8 w-full border-t border-slate-200 pt-6">
                  <label htmlFor="quantity" className="mb-2 block text-sm font-semibold">Quantidade</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-full border border-slate-300">
                      <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-11 w-11 text-xl" aria-label="Diminuir quantidade">−</button>
                      <span id="quantity" className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
                      <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="h-11 w-11 text-xl" aria-label="Aumentar quantidade">+</button>
                    </div>
                    <span className="text-sm text-slate-500">Total: <strong className="text-slate-900">{formatMoney(total, C.currency ?? "MZN")}</strong></span>
                  </div>
                  <button type="button" onClick={() => setStage("cart")} className="mt-5 min-h-14 w-full rounded-full px-6 font-semibold text-white" style={{ background: C.color || "#111827" }}>Adicionar ao carrinho</button>
                  <p className="mt-3 text-center text-xs text-slate-500">Encomenda simples e confirmação pelo WhatsApp.</p>
                </div>
              </section>
            </div>

            {testimonials.length > 0 && <section className="mt-14 border-t border-slate-200 pt-8">
              <h2 className="mb-5 text-2xl font-bold tracking-tight">O que os clientes dizem</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {testimonials.slice(0, 10).map((src, i) => (
                  <div key={src + i} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Depoimento de cliente ${i + 1}`} className="h-auto w-full object-contain" />
                  </div>
                ))}
              </div>
            </section>}
          </>
        )}

        {stage === "cart" && (
          <section className="mx-auto max-w-3xl">
            <button type="button" onClick={() => setStage("product")} className="mb-6 text-sm font-semibold text-slate-600">← Continuar a comprar</button>
            <h1 className="text-3xl font-bold tracking-tight">O teu carrinho</h1>
            <div className="mt-7 flex flex-col gap-5 border-y border-slate-200 py-5 sm:flex-row">
              {images[0] && <div className="h-28 w-28 flex-none overflow-hidden rounded-xl bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[0]} alt={C.name} className="h-full w-full object-contain" />
              </div>}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{C.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{formatMoney(C.price, C.currency ?? "MZN")} cada</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center rounded-full border border-slate-300">
                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-10 w-10 text-xl" aria-label="Diminuir quantidade">−</button>
                    <span className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="h-10 w-10 text-xl" aria-label="Aumentar quantidade">+</button>
                  </div>
                  <strong>{formatMoney(total, C.currency ?? "MZN")}</strong>
                </div>
                <button type="button" onClick={() => { setQuantity(1); setStage("product"); }} className="mt-3 text-sm text-slate-500 underline underline-offset-4">Remover produto</button>
              </div>
            </div>
            <div className="flex items-center justify-between py-6 text-lg"><span className="font-semibold">Subtotal</span><strong>{formatMoney(total, C.currency ?? "MZN")}</strong></div>
            <button type="button" onClick={goCheckout} className="min-h-14 w-full rounded-full px-6 font-semibold text-white" style={{ background: C.color || "#111827" }}>Continuar para checkout</button>
          </section>
        )}

        {stage === "checkout" && (
          <section className="mx-auto max-w-2xl">
            <button type="button" onClick={() => setStage("cart")} className="mb-6 text-sm font-semibold text-slate-600">← Voltar ao carrinho</button>
            <h1 className="text-3xl font-bold tracking-tight">Finalizar encomenda</h1>
            <div className="my-6 flex items-center justify-between border-y border-slate-200 py-5"><span>{C.name} × {quantity}</span><strong>{formatMoney(total, C.currency ?? "MZN")}</strong></div>
            <form onSubmit={submit} className="space-y-4">
              <div><label htmlFor="customer-name" className="mb-1.5 block text-sm font-semibold">Nome completo *</label><input id="customer-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-slate-900" autoComplete="name" /></div>
              <div><label htmlFor="customer-phone" className="mb-1.5 block text-sm font-semibold">WhatsApp / telefone *</label><input id="customer-phone" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-slate-900" inputMode="tel" autoComplete="tel" placeholder="Inclui o indicativo do país" /></div>
              {C.kind === "fisico" && <div><label htmlFor="customer-city" className="mb-1.5 block text-sm font-semibold">Cidade / local de entrega *</label><input id="customer-city" required maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-slate-900" autoComplete="address-level2" /></div>}
              {methods.length > 0 && <fieldset><legend className="mb-2 text-sm font-semibold">Método de pagamento *</legend><div className="space-y-2">{methods.map((m) => <label key={m.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4"><input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} />{m.label}</label>)}</div></fieldset>}
              <div><label htmlFor="order-notes" className="mb-1.5 block text-sm font-semibold">Observações (opcional)</label><textarea id="order-notes" rows={3} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" /></div>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <div className="flex items-center justify-between border-t border-slate-200 pt-5 text-lg"><span className="font-semibold">Total</span><strong>{formatMoney(total, C.currency ?? "MZN")}</strong></div>
              <button type="submit" disabled={busy} className="min-h-14 w-full rounded-full px-6 font-semibold text-white disabled:opacity-60" style={{ background: C.color || "#111827" }}>{busy ? "A preparar..." : "Confirmar pelo WhatsApp"}</button>
              <p className="text-center text-xs text-slate-500">A encomenda será enviada à loja pelo WhatsApp para confirmação.</p>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
