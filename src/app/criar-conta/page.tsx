import { redirect } from "next/navigation";
import Painel from "@/components/banca/Painel";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Criar conta | Crolina", robots: { index: false, follow: false } };

export default async function CriarContaPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (user) redirect("/painel");
  return <Painel initialMode="signup" />;
}
