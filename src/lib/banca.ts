export type Pay = { cod: boolean; mpesa: boolean; emola: boolean; mkesh: boolean; bank: boolean };
export type Question = { q: string; o: string[] };
export type FunnelConfig = {
  brand: string; aname: string; arole: string; name: string; kind: "fisico" | "digital";
  price: number; old: number; ben: string[]; imgs: string[]; qs: Question[];
  cities: string[]; dnote: string; pay: Pay; wa: string; color: string;
  collect: "off" | "optional" | "required";
};

export type Product = { id: string; name: string; kind: "fisico" | "digital"; price: number; old_price: number; benefits: string[]; images: string[] };
export type Funnel = { id: string; slug: string; name: string; config: FunnelConfig; published: boolean; product_id: string | null; created_at?: string };

export function mergeProduct(c: FunnelConfig, p?: Pick<Product, "name" | "kind" | "price" | "old_price" | "benefits" | "images"> | null): FunnelConfig {
  if (!p) return c;
  return { ...c, name: p.name, kind: p.kind, price: Number(p.price), old: Number(p.old_price), ben: p.benefits ?? [], imgs: p.images ?? [] };
}

/** Mozambique mobile numbers: 82-87 + 7 digits. Returns 258XXXXXXXXX or null. */
export function normalizeMz(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && /^8[2-7]/.test(d)) d = "258" + d;
  return /^258 ?8[2-7]\d{7}$/.test(d) ? d : null;
}

export const COLORS = ["#0e7c4a", "#1f5fbf", "#b8270f", "#7a3fb3", "#111111"];

export const DEFAULT_CONFIG: FunnelConfig = {
  brand: "A minha loja", aname: "Assistente", arole: "Assistente de encomendas", name: "", kind: "fisico",
  price: 0, old: 0, ben: [], imgs: [], qs: [], cities: ["Maputo", "Matola", "Beira", "Nampula"], dnote: "no mesmo dia",
  pay: { cod: true, mpesa: true, emola: false, mkesh: false, bank: false }, wa: "258", color: COLORS[0], collect: "optional",
};

export const NICHES = [
  { n: "Alívio de dores", kind: "fisico" as const, name: "Gel para dores musculares", ben: "Alivia dores musculares\nAbsorve rápido\nFácil de aplicar",
    qs: "Onde sentes a dor? | Costas; Joelhos; Pescoço e ombros; Articulações\nHá quanto tempo? | Menos de 2 semanas; 1 a 3 meses; Mais de 3 meses\nO que queres voltar a fazer? | Dormir bem; Trabalhar sem dor; Caminhar à vontade" },
  { n: "Cabelo e pele", kind: "fisico" as const, name: "Óleo para cabelo", ben: "Hidrata e dá brilho\nTextura leve\nFácil de usar",
    qs: "O que queres melhorar? | Hidratação; Brilho; Cabelo seco; Pele seca\nQuanto tempo tens por dia? | Menos de 5 minutos; Cerca de 10 minutos; Mais de 15 minutos\nJá usaste produtos parecidos? | Sim; Não" },
  { n: "Casa e cozinha", kind: "fisico" as const, name: "Organizador", ben: "Poupa espaço\nFácil de limpar\nFeito para durar",
    qs: "Onde vais usar? | Cozinha; Casa de banho; Quarto; Loja\nQuantas pessoas vivem em casa? | 1 a 2; 3 a 4; 5 ou mais\nO que mais te incomoda hoje? | Desorganização; Falta de espaço; Limpeza difícil" },
  { n: "Produto digital", kind: "digital" as const, name: "Curso ou e-book", ben: "Acesso imediato\nAprendes ao teu ritmo\nConteúdo em português",
    qs: "Qual é o teu objetivo? | Aprender do zero; Melhorar o que já sei; Começar um projeto\nQuanto tempo tens por semana? | Até 2 horas; 3 a 5 horas; Mais de 5 horas\nComo preferes aprender? | Vídeos; Texto; Os dois" },
  { n: "Em branco", kind: "fisico" as const, name: "", ben: "", qs: "" },
];

export const lines = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);
export const fmtMT = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " MT";
export const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);

export function parseQs(t: string): Question[] {
  return lines(t)
    .map((l) => {
      const [q, rest] = l.split("|");
      return { q: (q ?? "").trim(), o: (rest ?? "").split(";").map((s) => s.trim()).filter(Boolean) };
    })
    .filter((x) => x.q && x.o.length > 1)
    .slice(0, 5);
}
export const qsToText = (qs: Question[]) => qs.map((x) => `${x.q} | ${x.o.join("; ")}`).join("\n");

const BLOCK = /p[eé]nis|peniano|alargamento|ere[cç][aã]o|impot[eê]ncia|aument\w* (o )?tamanho/i;
const WARN = /\bcura\b|curar|curamos|milagr|100 ?%|garantid|elimina|para sempre|sem efeitos|aprovad\w+ (por|pelo) m[eé]dic|emagre\w+ \d+ ?kg|diagn[oó]stic/i;
const CRED = /\b(dr|dra|doutor|doutora|m[eé]dic[oa]|farmac[eê]utic[oa]|enfermeir[oa]|nutricionista|especialista)\b/i;

export function checkConfig(c: FunnelConfig) {
  const text = [c.brand, c.name, c.ben.join(" "), c.qs.map((x) => `${x.q} ${x.o.join(" ")}`).join(" "), c.dnote].join(" ");
  const warnings: string[] = [];
  const blocked = BLOCK.test(text);
  if (blocked) warnings.push("Promessas de tamanho ou de desempenho sexual não são permitidas. São falsas e levam ao bloqueio da conta de anúncios.");
  else if (WARN.test(text)) warnings.push('Encontrei uma promessa médica ou absoluta ("cura", "100%", "elimina"). O Meta bloqueia anúncios assim. Troca por "alivia" ou "ajuda".');
  if (CRED.test(`${c.aname} ${c.arole}`)) warnings.push("Não apresentes o assistente como médico, farmacêutico ou especialista.");
  if (!c.name) warnings.push("Falta o nome do produto.");
  if (c.price <= 0) warnings.push("Falta o preço.");
  if (c.wa.replace(/\D/g, "").length < 11) warnings.push("Confirma o número de WhatsApp, com 258.");
  if (c.qs.length < 1) warnings.push("Usa o formato Pergunta | opção; opção.");
  return { blocked, warnings, canPublish: !blocked && !!c.name && c.price > 0 && c.qs.length > 0 && c.wa.replace(/\D/g, "").length >= 11 };
}

export function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read"));
    r.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error("image"));
      im.onload = () => {
        const k = Math.min(1, 560 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const x = c.getContext("2d")!;
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.72));
      };
      im.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}
