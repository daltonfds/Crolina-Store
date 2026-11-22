"use client";

import { useCallback, useEffect, useState } from "react";
import { lines, shrinkImage, type Product } from "@/lib/banca";
import { area, btnD, btnP, btnS, hint, inp, lbl, panelCls, td, th, type SB } from "./ui";

type Draft = { id?: string; name: string; kind: "fisico" | "digital"; price: string; old: string; ben: string; images: string[]; testimonials: string[] };
const EMPTY: Draft = { name: "", kind: "fisico", price: "", old: "", ben: "", images: [], testimonials: [] };

export default function ProductsView({ sb, userId }: { sb: SB; userId: string }) {
  const [rows, setRows] = useState<Product[]>([]);
  const [d, setD] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const { data } = await sb.from("banca_products").select("id,name,kind,price,old_price,benefits,images,testimonials").order("created_at", { ascending: false });
    setRows((data as Product[]) ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  const edit = (p: Product) => setD({ id: p.id, name: p.name, kind: p.kind, price: String(p.price), old: p.old_price ? String(p.old_price) : "", ben: p.benefits.join("\n"), images: p.images ?? [], testimonials: p.testimonials ?? [] });
  const save = async () => {
    if (!d) return;
    const price = Number(d.price);
    if (!d.name.trim() || !(price > 0)) { setMsg("Preenche o nome e o preço."); return; }
    const row = { name: d.name.trim(), kind: d.kind, price, old_price: Number(d.old) || 0, benefits: lines(d.ben).slice(0, 7), images: d.images, testimonials: d.testimonials };
    const { error } = d.id ? await sb.from("banca_products").update(row).eq("id", d.id) : await sb.from("banca_products").insert({ ...row, owner_id: userId });
    if (error) { setMsg("Não foi possível guardar. Tenta outra vez."); return; }
    setD(null); setMsg(""); load();
  };
  const remove = async (p: Product) => {
    if (!confirm(`Apagar "${p.name}"? Os funis que o usam ficam sem produto.`)) return;
    await sb.from("banca_products").delete().eq("id", p.id);
    load();
  };
  const photos = async (files: FileList | null, category: "images" | "testimonials") => {
    if (!files || !d) return;
    const current = d[category] ?? [];
    const selected = Array.from(files);
    const remaining = 10 - current.length;
    if (remaining <= 0) { setMsg("Já atingiste o limite de 10 fotos nesta secção."); return; }
    const accepted = selected.slice(0, remaining);
    if (selected.length > remaining) setMsg(`Só podes adicionar mais ${remaining} foto(s) nesta secção.`);
    else setMsg("");
    try {
      const out: string[] = [];
      for (const file of accepted) out.push(await shrinkImage(file));
      setD((prev) => prev ? { ...prev, [category]: [...prev[category], ...out] } : prev);
    } catch {
      setMsg("Não foi possível processar uma das fotos. Tenta outra vez.");
    }
  };

  if (d) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{d.id ? "Editar produto" : "Novo produto"}</h1>
        <div className={`${panelCls} space-y-4 p-5`}>
          <div><label className={lbl} htmlFor="pn">Nome do produto</label><input id="pn" className={inp} value={d.name} maxLength={60} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl} htmlFor="pk">Tipo</label><select id="pk" className={inp} value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as "fisico" | "digital" })}><option value="fisico">Físico</option><option value="digital">Digital</option></select></div>
            <div><label className={lbl} htmlFor="pp">Preço (valor numérico)</label><input id="pp" className={inp} type="number" min={0} value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} /></div>
            <div><label className={lbl} htmlFor="po">Preço anterior</label><input id="po" className={inp} type="number" min={0} value={d.old} onChange={(e) => setD({ ...d, old: e.target.value })} /></div>
          </div>
          <div><label className={lbl} htmlFor="pb">Vantagens (uma por linha)</label><textarea id="pb" className={`${area} min-h-28`} value={d.ben} onChange={(e) => setD({ ...d, ben: e.target.value })} /><p className={hint}>Escreve só o que o produto faz, como vem na embalagem.</p></div>
          <div className="space-y-4">
            <div>
              <label className={lbl} htmlFor="pf">Fotos do produto (até 10)</label>
              <input id="pf" type="file" accept="image/*" multiple disabled={d.images.length >= 10} onChange={(e) => { photos(e.target.files, "images"); e.target.value = ""; }} className="block w-full text-sm" />
              <p className={hint}>{d.images.length}/10 fotos adicionadas. Mostra o produto, embalagem e detalhes.</p>
              {d.images.length > 0 && <div className="mt-2 grid grid-cols-5 gap-2">{d.images.map((s, i) => <div key={i} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */ <img src={s} alt={`Foto do produto ${i + 1}`} className="h-16 w-full rounded border border-gray-200 object-cover" />}<button type="button" onClick={() => setD({ ...d, images: d.images.filter((_, index) => index !== i) })} aria-label={`Remover foto do produto ${i + 1}`} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-sm shadow">×</button></div>)}</div>}
            </div>
            <div>
              <label className={lbl} htmlFor="pt">Fotos de depoimentos (até 10)</label>
              <input id="pt" type="file" accept="image/*" multiple disabled={d.testimonials.length >= 10} onChange={(e) => { photos(e.target.files, "testimonials"); e.target.value = ""; }} className="block w-full text-sm" />
              <p className={hint}>{d.testimonials.length}/10 fotos adicionadas. Adiciona capturas de mensagens ou avaliações de clientes.</p>
              {d.testimonials.length > 0 && <div className="mt-2 grid grid-cols-5 gap-2">{d.testimonials.map((s, i) => <div key={i} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */ <img src={s} alt={`Depoimento ${i + 1}`} className="h-16 w-full rounded border border-gray-200 object-cover" />}<button type="button" onClick={() => setD({ ...d, testimonials: d.testimonials.filter((_, index) => index !== i) })} aria-label={`Remover depoimento ${i + 1}`} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-sm shadow">×</button></div>)}</div>}
            </div>
            <p className={hint}>Todas as fotos são reduzidas automaticamente para abrirem depressa com dados móveis.</p>
          </div>
          {msg && <p className="text-sm text-red-700" role="alert">{msg}</p>}
          <div className="flex gap-2"><button type="button" className={btnP} onClick={save}>Guardar produto</button><button type="button" className={btnS} onClick={() => { setD(null); setMsg(""); }}>Cancelar</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold tracking-tight">Produtos</h1><button type="button" className={btnP} onClick={() => setD(EMPTY)}>Novo produto</button></div>
      <div className={`${panelCls} overflow-x-auto`}>
        {rows.length === 0 ? <p className="p-6 text-sm text-gray-500">Ainda não registaste nenhum produto.</p> : (
          <table className="w-full"><thead className="border-b border-gray-200"><tr><th className={th}>Produto</th><th className={th}>Tipo</th><th className={th}>Preço</th><th className={th}></th></tr></thead>
            <tbody className="divide-y divide-gray-100">{rows.map((p) => (
              <tr key={p.id}>
                <td className={td}><div className="flex items-center gap-3">{p.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt="" className="h-10 w-10 rounded border border-gray-200 object-cover" /> : <div className="h-10 w-10 rounded bg-gray-100" />}<span className="font-medium">{p.name}</span></div></td>
                <td className={td}>{p.kind === "digital" ? "Digital" : "Físico"}</td>
                <td className={`${td} tabular-nums`}>{p.price.toLocaleString("pt-PT")}</td>
                <td className={`${td} text-right`}><div className="flex justify-end gap-2"><button type="button" className={btnS} onClick={() => edit(p)}>Editar</button><button type="button" className={btnD} onClick={() => remove(p)}>Apagar</button></div></td>
              </tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}
