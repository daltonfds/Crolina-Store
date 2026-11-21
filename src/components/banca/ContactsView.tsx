"use client";

import { useEffect, useMemo, useState } from "react";
import { btnS, fmtDate, inp, panelCls, td, th, type SB } from "./ui";

type Lead = { id: string; name: string | null; phone: string; answers: string[]; created_at: string; funnel: { name: string } | { name: string }[] | null };
const fname = (f: Lead["funnel"]) => (Array.isArray(f) ? f[0]?.name : f?.name) ?? "";

export default function ContactsView({ sb }: { sb: SB }) {
  const [rows, setRows] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    sb.from("banca_leads").select("id,name,phone,answers,created_at,funnel:banca_funnels(name)").order("created_at", { ascending: false }).limit(2000)
      .then(({ data }) => setRows((data as unknown as Lead[]) ?? []));
  }, [sb]);
  const shown = useMemo(() => rows.filter((r) => `${r.name ?? ""} ${r.phone} ${fname(r.funnel)}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = ["nome,telefone,funil,data", ...shown.map((r) => [esc(r.name ?? ""), esc(`+${r.phone}`), esc(fname(r.funnel)), esc(r.created_at.slice(0, 10))].join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "contactos.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold tracking-tight">Contactos</h1>
        <div className="flex gap-2"><input className={`${inp} w-52`} placeholder="Procurar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Procurar contactos" /><button type="button" className={btnS} onClick={exportCsv} disabled={!shown.length}>Exportar CSV</button></div></div>
      <div className={`${panelCls} overflow-x-auto`}>
        {shown.length === 0 ? <p className="p-6 text-sm text-gray-500">Ainda não há números guardados. Ativa &quot;Guardar o número do cliente&quot; nas definições de cada funil.</p> : (
          <table className="w-full min-w-[560px]"><thead className="border-b border-gray-200"><tr><th className={th}>Nome</th><th className={th}>Telefone</th><th className={th}>Funil</th><th className={th}>Data</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{shown.map((r) => (
              <tr key={r.id}><td className={`${td} font-medium`}>{r.name || "Sem nome"}</td>
                <td className={`${td} tabular-nums`}><a className="text-[#0a7f8c] underline underline-offset-2" href={`https://wa.me/${r.phone}`} target="_blank" rel="noreferrer">+{r.phone}</a></td>
                <td className={td}>{fname(r.funnel)}</td><td className={`${td} whitespace-nowrap text-gray-500`}>{fmtDate(r.created_at)}</td></tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}
