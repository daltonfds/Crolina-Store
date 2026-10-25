export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export const TINTS = [
  { bg: "bg-soft-pink", fg: "text-deep-pink" },
  { bg: "bg-soft-mint", fg: "text-deep-mint" },
  { bg: "bg-soft-sand", fg: "text-deep-sand" },
  { bg: "bg-soft-lilac", fg: "text-deep-lilac" },
];

export function tintFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}
