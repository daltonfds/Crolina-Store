export type Tiers = { b3?: number | null; b6?: number | null };

/** Percentage off for a quantity: 6+ units use the 6-unit tier, 3+ units the 3-unit tier. */
export function tierPct(qty: number, t: Tiers): number {
  if (qty >= 6 && t.b6 != null) return Number(t.b6);
  if (qty >= 3 && t.b3 != null) return Number(t.b3);
  return 0;
}

/** Unit price after the bundle discount, rounded to cents. Must match create_store_order in the database. */
export function unitPriceFor(price: number, qty: number, t: Tiers): number {
  const pct = tierPct(qty, t);
  return Math.round(Number((price * (100 - pct)).toFixed(6))) / 100;
}

export function lineTotal(price: number, qty: number, t: Tiers): number {
  return Math.round(unitPriceFor(price, qty, t) * qty * 100) / 100;
}