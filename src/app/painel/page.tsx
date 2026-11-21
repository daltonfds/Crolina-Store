import type { Metadata } from "next";
import Painel from "@/components/banca/Painel";

export const metadata: Metadata = { title: { absolute: "Crolina | Funis de venda" }, robots: { index: false, follow: false } };

export default function PainelPage() {
  return <Painel />;
}
