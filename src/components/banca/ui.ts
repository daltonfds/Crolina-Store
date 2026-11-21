import type { createClient } from "@/lib/supabase/browser";

export type SB = ReturnType<typeof createClient>;

const base = "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btnP = `${base} bg-[#0a7f8c] text-white hover:bg-[#086772]`;
export const btnS = `${base} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50`;
export const btnD = `${base} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
export const inp = "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0a7f8c] focus:ring-1 focus:ring-[#0a7f8c]";
export const area = "w-full rounded-md border border-gray-300 bg-white p-3 text-sm outline-none focus:border-[#0a7f8c] focus:ring-1 focus:ring-[#0a7f8c]";
export const lbl = "mb-1 block text-sm font-medium text-gray-700";
export const hint = "mt-1 text-xs text-gray-500";
export const panelCls = "rounded-lg border border-gray-200 bg-white";
export const th = "px-4 py-2.5 text-left text-xs font-medium text-gray-500";
export const td = "px-4 py-3 text-sm";

export function fmtDate(s: string) {
  return new Date(s).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
