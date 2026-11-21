"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CURRENCIES, currencyDial, formatMoney, normalizePhone, type FunnelConfig } from "@/lib/banca";

type Msg = { id: number; from: "bot" | "me"; kind: "text" | "typing" | "img" | "card"; text?: string; src?: string };
type Panel =
  | { type: "none" }
  | { type: "choices"; options: string[]; pick: (v: string) => void }
  | { type: "name"; submit: (v: string) => void }
  | { type: "phone"; required: boolean; submit: (v: string | null) => void }
  | { type: "final"; href: string; name: string; city: string; answers: string[]; phone: string };

class Stop extends Error {}
const rd = (t: string) => Math.min(5000, Math.max(3000, 1800 + t.length * 22));

export default function FunnelChat({ config: C, slug, preview }: { config: FunnelConfig; slug?: string; preview?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [draft, setDraft] = useState("");
  const [round, setRound] = useState(0);
  const [phoneErr, setPhoneErr] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const key = JSON.stringify(C);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, panel]);

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise<void>((res, rej) => setTimeout(() => (alive ? res() : rej(new Stop())), ms));
    const push = (m: Omit<Msg, "id">) => {
      const id = ++idRef.current;
      setMsgs((p) => [...p, { ...m, id }]);
      return id;
    };
    const drop = (id: number) => setMsgs((p) => p.filter((x) => x.id !== id));
    const say = async (text: string, hold = 200) => {
      const t = push({ from: "bot", kind: "typing" });
      await sleep(Math.min(1500, 550 + text.length * 14));
      drop(t);
      push({ from: "bot", kind: "text", text });
      await sleep(hold);
    };
    const show = async (m: Omit<Msg, "id">, delay: number, hold: number) => {
      const t = push({ from: "bot", kind: "typing" });
      await sleep(delay);
      drop(t);
      push(m);
      await sleep(hold);
    };
    const choose = (options: string[]) =>
      new Promise<string>((res) =>
        setPanel({ type: "choices", options, pick: (v) => { setPanel({ type: "none" }); push({ from: "me", kind: "text", text: v }); res(v); } }),
      );
    const askName = () =>
      new Promise<string>((res) => {
        setDraft("");
        setPanel({ type: "name", submit: (v) => { setPanel({ type: "none" }); push({ from: "me", kind: "text", text: v }); res(v); } });
      });

    const askPhone = (required: boolean) =>
      new Promise<string | null>((res) => {
        setDraft("");
        setPhoneErr(false);
        setPanel({ type: "phone", required, submit: (v) => { setPanel({ type: "none" }); if (v) push({ from: "me", kind: "text", text: `+${v}` }); res(v); } });
      });

    setMsgs([]);
    setPanel({ type: "none" });
    (async () => {
      try {
        const dig = C.kind === "digital";
        const answers: string[] = [];
        const who = /^assistente$/i.test(C.aname) ? `o assistente da ${C.brand}` : `${C.aname}, da ${C.brand}`;
        await say(`Olá! Sou ${who}.`);
        await say("Vou fazer-te umas perguntas rápidas e depois digo-te o que te posso recomendar. Demora cerca de 30 segundos.");
        await say("Primeiro, como te chamas?");
        const name = await askName();
        await say(`Prazer, ${name}.`);
        for (let i = 0; i < C.qs.length; i++) {
          await say(C.qs[i].q);
          const v = await choose(C.qs[i].o);
          answers.push(`${C.qs[i].q} ${v}`);
          if (i < C.qs.length - 1) await say(`Entendido, ${name}.`);
        }
        let city = "";
        let free = false;
        if (!dig) {
          await say("Em que cidade estás?");
          city = await choose([...C.cities.slice(0, 5), "Outra cidade ou província"]);
          free = C.cities.includes(city);
        }
        await say(`Já tenho tudo, ${name}. Deixa-me preparar a recomendação.`, 1200);
        const m1 = `Com o que me contaste, recomendo ${C.name}.`;
        await say(m1, rd(m1));
        C.imgs.slice(0, 3).forEach((src) => push({ from: "bot", kind: "img", src }));
        if (C.imgs.length) await sleep(2500);
        await show({ from: "bot", kind: "card" }, 1100, 4500);
        const d = dig
          ? "Depois do pagamento, recebes o acesso de imediato pelo WhatsApp."
          : free
            ? `Boa notícia: a entrega na tua cidade é grátis e chega ${C.dnote}.`
            : "Entregamos também fora das cidades com entrega grátis. Confirmamos o custo e o prazo pelo WhatsApp.";
        await say(d, rd(d));
        const p: string[] = [];
        if (C.pay.cod && !dig) p.push("pagas só quando receberes o produto");
        if (C.pay.mpesa) p.push("M-Pesa");
        if (C.pay.emola) p.push("e-Mola");
        if (C.pay.mkesh) p.push("mKesh");
        if (C.pay.bank) p.push("transferência bancária");
        const pm = C.pay.cod && !dig
          ? `Confirmamos primeiro a disponibilidade pelo WhatsApp, e o entregador leva o produto até ti. Podes pagar assim: ${p.join(", ")}.`
          : `Podes pagar por: ${p.join(", ")}.`;
        await say(pm, rd(pm));
        let phone = "";
        if (C.collect && C.collect !== "off") {
          await say(C.collect === "required" ? "Para confirmarmos a tua encomenda, deixa-me o teu número de WhatsApp." : "Se quiseres, deixa o teu número de WhatsApp para te enviarmos a confirmação.");
          const got = await askPhone(C.collect === "required");
          if (got) {
            phone = got;
            if (slug && !preview) {
              fetch("/api/banca/leads", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({ slug, name, phone: got, currency: C.currency ?? "MZN", answers }) }).catch(() => undefined);
            }
          }
        }
        const msg =
          `Olá! Quero ${dig ? "comprar" : "encomendar"}: ${C.name} (${formatMoney(C.price, C.currency ?? "MZN")}).\nNome: ${name}` +
          (city ? `\nCidade: ${city}` : "") + `\n${answers.join("\n")}` +
          (dig ? "\n\nComo recebo o acesso?" : "\n\nConfirmam a disponibilidade, por favor?");
        setPanel({ type: "final", href: `https://wa.me/${C.wa.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, name, city, answers, phone });
      } catch (e) {
        if (!(e instanceof Stop)) throw e;
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, round]);

  const order = (f: Extract<Panel, { type: "final" }>) => {
    if (!slug || preview) return;
    fetch("/api/banca/orders", {
      method: "POST", headers: { "content-type": "application/json" }, keepalive: true,
      body: JSON.stringify({ slug, name: f.name, city: f.city || undefined, product: C.name, price: C.price, currency: C.currency ?? "MZN", answers: f.answers, phone: f.phone || undefined }),
    }).catch(() => undefined);
  };

  const theme = { "--color-ink": C.color, "--color-line": "#e2e8e9", "--color-muted": "#687782", "--color-surface": "#f1f5f6", color: "#0d1b2a" } as CSSProperties;

  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-white" style={theme}>
      <header className="flex items-center gap-3 border-b border-line px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div aria-hidden className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ink text-lg font-semibold text-white">{(C.aname || "A").charAt(0).toUpperCase()}</div>
        <div className="leading-tight"><b className="block text-[17px] font-semibold">{C.aname}</b><span className="text-xs text-muted">{C.arole}</span></div>
      </header>

      <div ref={logRef} className="flex-1 overflow-y-auto scroll-smooth px-4 pb-2 pt-4" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`mb-2.5 flex ${m.from === "me" ? "justify-end" : ""}`}>
            {m.kind === "typing" && (
              <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-surface px-4 py-3.5" aria-label="A escrever">
                {[0, 1, 2].map((i) => <i key={i} className="h-[7px] w-[7px] animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            )}
            {m.kind === "text" && (
              <div className={`max-w-[84%] whitespace-pre-line px-4 py-2.5 leading-snug ${m.from === "me" ? "rounded-2xl rounded-br-sm bg-ink font-medium text-white" : "rounded-2xl rounded-bl-sm bg-surface"}`}>{m.text}</div>
            )}
            {m.kind === "img" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.src} alt={C.name} className="max-h-60 max-w-[60%] rounded-2xl rounded-bl-sm border border-line bg-white" />
            )}
            {m.kind === "card" && (
              <div className="w-full max-w-[86%] rounded-2xl rounded-bl-sm border border-line bg-white p-4">
                <p className="mb-2 font-semibold">{C.kind === "digital" ? "O que recebes:" : "Vantagens:"}</p>
                <ul className="space-y-2">
                  {C.ben.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[15px] leading-snug">
                      <span aria-hidden className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] text-white" style={{ background: "#178f47" }}>✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-3xl font-semibold tracking-tight">{fmtMT(C.price)}</span>
                  {C.old > C.price && <s className="text-muted">{formatMoney(C.old, C.currency ?? "MZN")}</s>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {panel.type !== "none" && (
        <div className="max-h-[46dvh] overflow-y-auto border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {panel.type === "choices" && panel.options.map((o) => (
            <button key={o} type="button" onClick={() => panel.pick(o)} className="btn btn-outline mb-2 h-auto min-h-[3rem] w-full justify-start py-3 text-left">{o}</button>
          ))}
          {panel.type === "name" && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = draft.trim(); if (v) panel.submit(v); }}>
              <input autoFocus className="field flex-1" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="O teu primeiro nome" autoComplete="given-name" maxLength={40} aria-label="O teu primeiro nome" />
              <button type="submit" className="btn btn-primary w-12 px-0" aria-label="Enviar">→</button>
            </form>
          )}
          {panel.type === "phone" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = normalizePhone(draft, C.currency ?? "MZN");
                if (!n) { setPhoneErr(true); return; }
                panel.submit(n);
              }}
            >
              <div className="flex gap-2">
                <span className="grid h-12 flex-none place-items-center rounded-xl border border-line bg-surface px-3 text-sm text-muted">+{currencyDial(C.currency ?? "MZN")}</span>
                <input autoFocus className="field flex-1" value={draft} onChange={(e) => { setDraft(e.target.value); setPhoneErr(false); }} placeholder={CURRENCIES.find((x) => x.code === (C.currency ?? "MZN"))?.example ?? "84 000 0000"} inputMode="tel" autoComplete="tel-national" maxLength={14} aria-label="Número de WhatsApp" />
                <button type="submit" className="btn btn-primary w-12 px-0" aria-label="Enviar">→</button>
              </div>
              {phoneErr && <p className="mt-2 text-sm" style={{ color: "#b42318" }}>Escreve um número válido para o país selecionado.</p>}
              <p className="mt-2 text-xs text-muted">Usamos o teu número só para falar sobre esta encomenda.</p>
              {!panel.required && <button type="button" onClick={() => panel.submit(null)} className="mt-1 block min-h-11 w-full text-center text-sm text-muted underline underline-offset-4">Saltar</button>}
            </form>
          )}
          {panel.type === "final" && (
            <>
              <a href={panel.href} target="_blank" rel="noopener noreferrer" onClick={() => order(panel)} style={{ background: "#178f47" }} className="btn btn-primary mb-1.5 w-full justify-between">
                <span>Encomendar pelo WhatsApp</span><span aria-hidden>→</span>
              </a>
              <button type="button" onClick={() => setRound((r) => r + 1)} className="block min-h-11 w-full text-center text-sm text-muted underline underline-offset-4">Recomeçar</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
