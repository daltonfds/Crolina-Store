import type { Product } from "@/lib/types";

export const KIDS_COLORS = { blue: "#1170d8", green: "#1f9d55", orange: "#d9620a", pink: "#d6336c", yellow: "#ffd93b", coral: "#e0453a" } as const;

export const AGE_BANDS = [
  { key: "0-2", label: "0–2", min: 0, max: 2, color: KIDS_COLORS.blue },
  { key: "3-5", label: "3–5", min: 3, max: 5, color: KIDS_COLORS.green },
  { key: "6-8", label: "6–8", min: 6, max: 8, color: KIDS_COLORS.orange },
  { key: "9-12", label: "9–12", min: 9, max: 12, color: KIDS_COLORS.pink },
] as const;

/** "Ages 3+", "Ages 3–5" or null when the product has no age set. */
export function ageLabel(p: Pick<Product, "age_min" | "age_max">): string | null {
  const { age_min: a, age_max: b } = p;
  if (a == null && b == null) return null;
  if (a != null && b != null) return a === b ? `Age ${a}` : `Ages ${a}–${b}`;
  if (a != null) return `Ages ${a}+`;
  return `Up to ${b} yrs`;
}

/** Does the product's age range overlap the band? Products without an age match every band. */
export function inBand(p: Pick<Product, "age_min" | "age_max">, band: (typeof AGE_BANDS)[number]): boolean {
  if (p.age_min == null && p.age_max == null) return true;
  const lo = p.age_min ?? 0;
  const hi = p.age_max ?? 17;
  return lo <= band.max && hi >= band.min;
}

/** Colour of the age tag: the band of the product's lowest age. */
export function tagColor(p: Pick<Product, "age_min" | "age_max">): string {
  const a = p.age_min ?? p.age_max ?? 0;
  return (AGE_BANDS.find((b) => a >= b.min && a <= b.max) ?? AGE_BANDS[3]).color;
}
