"use client";

import { useCallback, useEffect, useState } from "react";
import FunnelChat from "./FunnelChat";
import { COLORS, CURRENCIES, DEFAULT_CONFIG, NICHES, checkConfig, mergeProduct, parseQs, qsToText, slugify, type Funnel, type FunnelConfig, type Product } from "@/lib/banca";
import { area, btnP, btnS, hint, inp, lbl, panelCls, td, th, type SB } from "./ui";
import type { Tab } from "./Painel";

export default function FunnelsView({ sb, userId, go }: { sb: SB; userId: string; go: (t: Tab) => void }) {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [edit, setEdit] = useState<Funnel | "new" | null>(null);
  const load = useCallback(async () => {
    const [f, p] = await Promise.all([
      sb.from("banca_funnels").select("id,slug,name,config,published,product_id").order("created_at", { ascending: false }),
      sb.from("banca_products").select("id,name,kind,price,old_price,benefits,images").order("created_at", { ascending: false }),
    ]);
    setFunnels((f.data as Funnel[]) ?? []);
    setProducts((p.data as Product[]) ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  if (edit) return <Editor sb={sb} userId={userId} funnel={edit === "new" ? null : edit} products={products} done={() => { setEdit(null); load(); }} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold tracking-tight">Funis</h1>
        <button type="button" className={btnP} onClick={() => (products.length ? setEdit("new") : go("produtos"))}>Novo funil</button></div>
      {products.length === 0 && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Para criares um funil, regista primeiro um produto.</p>}
      <div className={`${panelCls} overflow-x-auto`}>
        {funnels.length === 0 ? <p className="p-6 text-sm text-gray-500">Ainda não criaste nenhum funil.</p> : (
          <table className="w-full"><thead className="border-b border-gray-200"><tr><th className={th}>Funil</th><th className={th}>Estado</th><th className={th}>Link</th><th className={th}></th></tr></thead>
            <tbody className="divide-y divide-gray-100">{funnels.map((f) => (
              <tr key={f.id}>
                <td className={`${td} font-medium`}>{f.name}</td>
                <td className={td}>{f.published ? "Publicado" : "Rascunho"}</td>
                <td className={td}>{f.published ? <a className="text-[#0a7f8c] underline underline-offset-2" href={`/f/${f.slug}`} target="_blank" rel="noreferrer">/f/{f.slug}</a> : <span className="text-gray-400">/f/{f.slug}</span>}</td>
                <td className={`${td} text-right`}><button type="button" className={btnS} onClick={() => setEdit(f)}>Editar</button></td>
              </tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}

function Editor({ sb, userId, funnel, products, done }: { sb: SB; userId: string; funnel: Funnel | null; products: Product[]; done: () => void }) {
  const base: FunnelConfig = funnel?.config ?? { ...DEFAULT_CONFIG };
  const [c, setC] = useState<FunnelConfig>(base);
  const [qs, setQs] = useState(qsToText(base.qs));
  const [cities, setCities] = useState(base.cities.join(", "));
  const [pid, setPid] = useState(funnel?.product_id ?? products[0]?.id ?? "");
  const [slug, setSlug] = useState(funnel?.slug ?? "");
  const [pub, setPub] = useState(funnel?.published ?? false);
  const [msg, setMsg] = useState("");
  const set = <K extends keyof FunnelConfig>(k: K, v: FunnelConfig[K]) => setC((p) => ({ ...p, [k]: v }));

  const product = products.find((p) => p.id === pid) ?? null;
  const cfg = mergeProduct({ ...c, qs: parseQs(qs), cities: cities.split(",").map((s) => s.trim()).filter(Boolean) }, product);
  const [live, setLive] = useState(cfg);
  useEffect(() => { const t = setTimeout(() => setLive(cfg), 500); return () => clearTimeout(t); }, [JSON.stringify(cfg)]); // eslint-disable-line react-hooks/exhaustive-deps
  const chk = checkConfig(cfg);

  const save = async () => {
    setMsg("");
    if (pub && !chk.canPublish) { setMsg("Corrige os avisos antes de publicar."); return; }
    const finalSlug = slugify(slug || cfg.name || cfg.brand) || `funil-${Math.random().toString(36).slice(2, 6)}`;
    const stored = { ...cfg, name: "", ben: [], imgs: [], price: 0, old: 0 };
    const row = { slug: finalSlug, name: product?.name ?? cfg.brand, config: stored, product_id: pid || null, published: pub, updated_at: new Date().toISOString() };
    const { error } = funnel ? await sb.from("banca_funnels").update(row).eq("id", funnel.id) : await sb.from("banca_funnels").insert({ ...row, owner_id: userId });
    if (error) setMsg(error.code === "23505" ? "Esse endereço já existe. Escolhe outro." : "Não foi possível guardar. Tenta outra vez.");
    else done();
  };

  const F = (label: string, v: string, on: (s: string) => void, max = 60, id?: string) => (
    <div><label className={lbl} htmlFor={id}>{label}</label><input id={id} className={inp} value={v} maxLength={max} onChange={(e) => on(e.target.value)} /></div>
  );
  const payLabels = { cod: "Pagamento na entrega", mpesa: "M-Pesa", emola: "e-Mola", mkesh: "mKesh", bank: "Transferência" } as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{funnel ? "Editar funil" : "Novo funil"}</h1>
        {chk.warnings.length > 0 && <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{chk.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}

        <section className={`${panelCls} space-y-4 p-5`}>
          <h2 className="text-sm font-semibold">Produto, moeda e assistente</h2>
          <div><label className={lbl} htmlFor="currency">Moeda utilizada neste funil</label><select id="currency" className={inp} value={c.currency ?? "MZN"} onChange={(e) => set("currency", e.target.value as FunnelConfig["currency"])}>{CURRENCIES.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}</select><p className={hint}>Os preços do produto serão apresentados nesta moeda. Não há conversão automática.</p></div>
          <div><label className={lbl} htmlFor="prod">Produto</label>
            <select id="prod" className={inp} value={pid} onChange={(e) => setPid(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <p className={hint}>O preço, as fotos e as vantagens vêm do produto. Para os mudar, edita o produto.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">{F("Nome da loja", c.brand, (s) => set("brand", s), 40, "br")}{F("Nome do assistente", c.aname, (s) => set("aname", s), 30, "an")}</div>
          {F("Descrição do assistente", c.arole, (s) => set("arole", s), 40, "ar")}
          <p className={hint}>Não uses &quot;Dr.&quot; nem &quot;farmacêutico&quot;: o assistente não é um profissional de saúde.</p>
        </section>

        <section className={`${panelCls} space-y-4 p-5`}>
          <h2 className="text-sm font-semibold">Perguntas</h2>
          <div><label className={lbl} htmlFor="tpl">Começar com as perguntas de</label>
            <select id="tpl" className={inp} value="" onChange={(e) => { const n = NICHES[+e.target.value]; if (n) setQs(n.qs); }}><option value="">Escolher um modelo</option>{NICHES.filter((n) => n.qs).map((n, i) => <option key={n.n} value={i}>{n.n}</option>)}</select></div>
          <div><label className={lbl} htmlFor="qs">Uma pergunta por linha: Pergunta | opção; opção</label><textarea id="qs" className={`${area} min-h-32`} value={qs} onChange={(e) => setQs(e.target.value)} /></div>
        </section>

        <section className={`${panelCls} space-y-4 p-5`}>
          <h2 className="text-sm font-semibold">Entrega, pagamento e contacto</h2>
          {F("Cidades com entrega grátis (separadas por vírgula)", cities, setCities, 200, "ci")}
          {F("Prazo de entrega", c.dnote, (s) => set("dnote", s), 60, "dn")}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">{(Object.keys(payLabels) as (keyof typeof payLabels)[]).map((k) => (
            <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={c.pay[k]} onChange={(e) => set("pay", { ...c.pay, [k]: e.target.checked })} />{payLabels[k]}</label>))}</div>
          {F("WhatsApp da loja (com código do país)", c.wa, (s) => set("wa", s.replace(/\D/g, "")), 15, "wa")}
          <div><label className={lbl} htmlFor="col">Guardar o número do cliente no fim da conversa</label>
            <select id="col" className={inp} value={c.collect} onChange={(e) => set("collect", e.target.value as FunnelConfig["collect"])}>
              <option value="optional">Sim, opcional (o cliente pode saltar)</option><option value="required">Sim, obrigatório</option><option value="off">Não pedir o número</option></select>
            <p className={hint}>Os números ficam em Contactos, com a opção de exportar.</p></div>
        </section>

        <section className={`${panelCls} space-y-4 p-5`}>
          <h2 className="text-sm font-semibold">Aspeto e publicação</h2>
          <div><span className={lbl}>Cor</span><div className="flex gap-2">{COLORS.map((col) => <button key={col} type="button" aria-label={`Cor ${col}`} onClick={() => set("color", col)} className="h-8 w-8 rounded-full" style={{ background: col, outline: c.color === col ? "2px solid #111827" : "1px solid #d1d5db", outlineOffset: 2 }} />)}</div></div>
          <div><label className={lbl} htmlFor="sl">Endereço do funil</label>
            <div className="flex items-center gap-2"><span className="text-sm text-gray-500">/f/</span><input id="sl" className={inp} value={slug} maxLength={36} onChange={(e) => setSlug(slugify(e.target.value))} /></div></div>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />Publicado (visível para quem tiver o link)</label>
        </section>

        {msg && <p className="text-sm text-red-700" role="alert">{msg}</p>}
        <div className="flex gap-2"><button type="button" className={btnP} onClick={save}>Guardar funil</button><button type="button" className={btnS} onClick={done}>Cancelar</button></div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-sm font-medium text-gray-700">Pré-visualização</p>
        <div className="h-[640px] overflow-hidden rounded-[1.75rem] border-[7px] border-gray-900 bg-white"><FunnelChat config={live} preview /></div>
      </div>
    </div>
  );
}
