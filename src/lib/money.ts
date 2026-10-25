export function formatZAR(value: number) {
  const n = Number(value) || 0;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  return `${n < 0 ? "-" : ""}R ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
}
