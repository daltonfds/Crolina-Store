import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Painel from "@/components/banca/Painel";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { absolute: "Crolina | Funis de venda" }, robots: { index: false, follow: false } };

export default async function PainelPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/entrar");
  return <Painel />;
}
