import { Resend } from "resend";
const resendKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || "Crolina Shop <support@crolina.shop>";
const support = process.env.STORE_ALERT_EMAIL || "support@crolina.shop";
export async function sendOrderCreatedEmail(order: {order_reference:string;customer_name:string;customer_email:string;total_zar:number|string;payment_method:string;shipping_address:Record<string,unknown>}) {
  if (!resendKey) { console.warn("RESEND_API_KEY is not configured; order email skipped."); return; }
  const resend = new Resend(resendKey);
  const total = Number(order.total_zar).toLocaleString("en-ZA",{style:"currency",currency:"ZAR"});
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172a25"><h1>Thanks for your order, ${escapeHtml(order.customer_name)}.</h1><p>Your Crolina Shop order has been received.</p><p><strong>Order reference:</strong> ${escapeHtml(order.order_reference)}</p><p><strong>Total:</strong> ${total}</p><p><strong>Payment method:</strong> ${escapeHtml(order.payment_method.replaceAll("_"," "))}</p><p>We will confirm payment after reviewing it. Keep your order reference for any enquiries.</p><p>Crolina Shop Support</p></div>`;
  const [customerResult, adminResult] = await Promise.all([
    resend.emails.send({from,to:order.customer_email,subject:`Crolina Shop order ${order.order_reference}`,html}),
    resend.emails.send({from,to:support,subject:`New order ${order.order_reference}`,html:`<p>New order received.</p><p>Reference: ${escapeHtml(order.order_reference)}</p><p>Customer: ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_email)})</p><p>Total: ${total}</p>`})
  ]);
  if (customerResult.error) console.error("Customer email failed",customerResult.error);
  if (adminResult.error) console.error("Admin email failed",adminResult.error);
}
export async function sendProofSubmittedEmail(order: {order_reference:string;customer_name:string;customer_email:string;total_zar:number|string}) {
  if (!resendKey) { console.warn("RESEND_API_KEY is not configured; proof email skipped."); return; }
  const resend = new Resend(resendKey);
  const html = `<p>Payment proof submitted for order <strong>${escapeHtml(order.order_reference)}</strong>.</p><p>Customer: ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_email)})</p><p>Total: R ${Number(order.total_zar).toFixed(2)}</p><p>Review the private proof in the administrator dashboard.</p>`;
  const result = await resend.emails.send({from,to:support,subject:`Payment proof submitted: ${order.order_reference}`,html});
  if (result.error) console.error("Proof notification failed",result.error);
}
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (c) => { switch(c) { case "&": return "&amp;"; case "<": return "&lt;"; case ">": return "&gt;"; case '"': return "&quot;"; case "'": return "&#39;"; default: return c; } }); }
