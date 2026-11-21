"use client";

import { useEffect, useState } from "react";
import { formatMoney, type CurrencyCode } from "@/lib/banca";
import { fmtDate, inp, panelCls, td, th, type SB } from "./ui";

type Row = { id: string; customer_name: string; phone: string | null; city: string | null; product: string | null; price: number | null; currency: CurrencyCode | null; answers: string[]; status: string; created_at: string; funnel: { name: string } | { name: string }[] | null };
const STATUS = ["novo", "confirmado", "entregue", "cancelado"];
const fname = (f: Row["funnel"]) => (Array.isArray(f) ? f[0]?.name : f?.name) ?? "";

export default function OrdersView({ sb }: { sb: SB }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("todos");
  useEffect(() => {
    sb.from("banca_orders").select("id,customer_name,phone,city,product,price,currency,answers,status,created_at,funnel:banca_funnels(name)").order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, [sb]);
  const setStatus = async (id: string, status: string) => {
    await sb.from("banca_orders").update({ status }).eq("id", id);
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
  };
  const shown = filter === "todos" ? rows : rows.filter((r) => r.status === filter);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold tracking-tight">Pedidos</h1>
        <select className={`${inp} w-44`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar por estado"><option value="todos">Todos os estados</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div className={`${panelCls} overflow-x-auto`}>
        {shown.length === 0 ? <p className="p-6 text-sm text-gray-500">Sem pedidos. Aparecem aqui quando um cliente toca em &quot;Encomendar pelo WhatsApp&quot;.</p> : (
          <table className="w-full min-w-[720px]"><thead className="border-b border-gray-200"><tr><th className={th}>Data</th><th className={th}>Cliente</th><th className={th}>Produto</th><th className={th}>Valor</th><th className={th}>Estado</th></tr></thead>
            <tbody className="divide-y divide-gray-100 align-top">{shown.map((r) => (
              <tr key={r.id}>
                <td className={`${td} whitespace-nowrap text-gray-500`}>{fmtDate(r.created_at)}</td>
                <td className={td}><p className="font-medium">{r.customer_name}</p><p className="text-xs text-gray-500">{[r.city, r.phone && `+${r.phone}`].filter(Boolean).join(" · ")}</p>
                  {r.phone && <a className="text-xs text-[#0a7f8c] underline underline-offset-2" href={`https://wa.me/${r.phone}`} target="_blank" rel="noreferrer">Abrir WhatsApp</a>}</td>
                <td className={td}><p>{r.product}</p><p className="text-xs text-gray-500">{fname(r.funnel)}</p></td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{r.price ? formatMoney(r.price, r.currency ?? "MZN") : ""}</td>
                <td className={td}><select className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm" value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} aria-label="Estado do pedido">{STATUS.map((s) => <option key={s}>{s}</option>)}</select></td>
              </tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}
