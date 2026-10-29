import { STORE } from "@/lib/config";
import { formatZAR } from "@/lib/money";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  }).catch(() => null);
  return !!res && res.ok;
}

export async function sendOrderEmails(o: { reference: string; name: string; email: string; total: number; method: string }) {
  const link = `${STORE.url}/order/${o.reference}`;
  const how = (o.method === "eft" ? "Pay by EFT using your order reference, then upload your proof of payment (photo or document) on the order page." : "Use the pay button on your order page.") + ` Delivery takes ${STORE.deliveryTime} nationwide once your payment is confirmed.`;
  await sendEmail(
    o.email,
    `Your Crolina order ${o.reference}`,
    `<p>Hi ${esc(o.name)},</p><p>Thank you for your order <b>${o.reference}</b> (${formatZAR(o.total)}).</p><p>${how}</p><p><a href="${link}">View your order</a></p><p>Crolina — ${STORE.tagline}</p>`,
  );
  await sendEmail(
    process.env.STORE_ALERT_EMAIL || "",
    `New order ${o.reference} (${formatZAR(o.total)})`,
    `<p>New order <b>${o.reference}</b> from ${esc(o.name)} (${esc(o.email)}) for ${formatZAR(o.total)}.</p><p><a href="${STORE.url}/admin/orders">Open admin</a></p>`,
  );
}
