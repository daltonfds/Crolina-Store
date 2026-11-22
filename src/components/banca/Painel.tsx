"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { btnP, btnS, inp, lbl, panelCls, type SB } from "./ui";
import ProductsView from "./ProductsView";
import FunnelsView from "./FunnelsView";
import OrdersView from "./OrdersView";
import ContactsView from "./ContactsView";

export type Tab = "resumo" | "funis" | "produtos" | "pedidos" | "contactos";
const TABS: [Tab, string][] = [["resumo", "Resumo"], ["funis", "Funis"], ["produtos", "Produtos"], ["pedidos", "Pedidos"], ["contactos", "Contactos"]];

export default function Painel({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const sb = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("resumo");

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  if (session === undefined) return <div className="p-8 text-sm text-gray-500">A carregar...</div>;
  if (!session) return <Auth sb={sb} initialSignup={initialMode === "signup"} />;

  const shop = (session.user.user_metadata?.shop_name as string | undefined) || session.user.email;
  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-900">
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
        <div className="flex items-baseline gap-3"><span className="text-lg font-semibold tracking-tight">Crolina</span><span className="hidden text-sm text-gray-500 sm:inline">{shop}</span></div>
        <button type="button" onClick={() => sb.auth.signOut()} className="text-sm text-gray-600 hover:text-gray-900">Sair</button>
      </header>
      <div className="mx-auto grid max-w-6xl md:grid-cols-[190px_1fr]">
        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-2 md:block md:border-b-0 md:bg-transparent md:px-4 md:py-6" aria-label="Painel">
          {TABS.map(([id, name]) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
              className={`block whitespace-nowrap px-3 py-3 text-left text-sm md:w-full md:rounded-md md:py-2 ${tab === id ? "border-b-2 border-[#0a7f8c] font-medium text-gray-900 md:border-b-0 md:bg-gray-200/70" : "text-gray-600 hover:text-gray-900"}`}>{name}</button>
          ))}
        </nav>
        <main className="min-w-0 px-4 py-6 md:px-6">
          {tab === "resumo" && <Summary sb={sb} go={setTab} />}
          {tab === "produtos" && <ProductsView sb={sb} userId={session.user.id} />}
          {tab === "funis" && <FunnelsView sb={sb} userId={session.user.id} go={setTab} />}
          {tab === "pedidos" && <OrdersView sb={sb} />}
          {tab === "contactos" && <ContactsView sb={sb} />}
        </main>
      </div>
    </div>
  );
}

function Auth({ sb }: { sb: SB }) {
  const [signup, setSignup] = useState(false);
  const [shop, setShop] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setBusy(true);
    const { data, error } = signup
      ? await sb.auth.signUp({ email, password: pw, options: { data: { shop_name: shop.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/painel` } })
      : await sb.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) setMsg(error.message.includes("Invalid login") ? "Email ou palavra-passe incorretos." : error.message);
    else if (signup && !data.session) setMsg("Enviámos um email de confirmação. Abre o link e volta aqui para entrar.");
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8] px-4">
      <form onSubmit={submit} className={`${panelCls} w-full max-w-sm space-y-4 p-6`}>
        <div>
          <p className="text-xl font-semibold tracking-tight">Crolina</p>
          <p className="mt-1 text-sm text-gray-600">Vende mais com funis de conversa, e recebe os pedidos e os contactos num só sítio.</p>
        </div>
        <div className="flex border-b border-gray-200 text-sm">
          {[false, true].map((v) => (
            <button key={String(v)} type="button" onClick={() => { setSignup(v); setMsg(""); }} className={`-mb-px flex-1 border-b-2 pb-2 ${signup === v ? "border-[#0a7f8c] font-medium" : "border-transparent text-gray-500"}`}>{v ? "Criar conta" : "Entrar"}</button>
          ))}
        </div>
        {signup && <div><label className={lbl} htmlFor="shop">Nome da loja</label><input id="shop" className={inp} value={shop} onChange={(e) => setShop(e.target.value)} maxLength={40} required /></div>}
        <div><label className={lbl} htmlFor="em">Email</label><input id="em" className={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
        <div><label className={lbl} htmlFor="pw">Palavra-passe</label><input id="pw" className={inp} type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} autoComplete={signup ? "new-password" : "current-password"} required /></div>
        <button type="submit" disabled={busy} className={`${btnP} w-full`}>{signup ? "Criar conta" : "Entrar"}</button>
        {msg && <p className="text-sm text-gray-700" role="alert">{msg}</p>}
      </form>
    </div>
  );
}

function Summary({ sb, go }: { sb: SB; go: (t: Tab) => void }) {
  const [n, setN] = useState({ products: 0, funnels: 0, published: 0, orders: 0, leads: 0 });
  useEffect(() => {
    (async () => {
      const count = async (t: string, f?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const q = sb.from(t).select("id", { count: "exact", head: true });
        const { count: c } = await (f ? f(q) : q);
        return c ?? 0;
      };
      const [products, funnels, published, orders, leads] = await Promise.all([
        count("banca_products"), count("banca_funnels"), count("banca_funnels", (q) => q.eq("published", true)),
        count("banca_orders", (q) => q.eq("status", "novo")), count("banca_leads"),
      ]);
      setN({ products, funnels, published, orders, leads });
    })();
  }, [sb]);
  const steps: [string, boolean, Tab][] = [["Regista o teu primeiro produto", n.products > 0, "produtos"], ["Cria um funil com esse produto", n.funnels > 0, "funis"], ["Publica o funil e usa o link nos teus anúncios", n.published > 0, "funis"]];
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Resumo</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Produtos", n.products], ["Funis publicados", n.published], ["Pedidos novos", n.orders], ["Contactos", n.leads]].map(([l, v]) => (
          <div key={l} className={`${panelCls} p-4`}><p className="text-xs text-gray-500">{l}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p></div>
        ))}
      </div>
      <section className={`${panelCls} p-5`}>
        <h2 className="mb-3 text-sm font-semibold">Para começar</h2>
        <ol className="space-y-2.5 text-sm">
          {steps.map(([t, done, tab], i) => (
            <li key={t} className="flex items-center justify-between gap-3">
              <span className={done ? "text-gray-400 line-through" : ""}>{i + 1}. {t}</span>
              {!done && <button type="button" className={btnS} onClick={() => go(tab)}>Abrir</button>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
