import { RETURNS, returnStatusMeta, reasonLabel, typeLabel, type ReturnRow } from "@/lib/returns";
import { sendEmail } from "@/lib/email";
import { STORE } from "@/lib/config";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const para = (s: string) => esc(s).replace(/\n/g, "<br>");
const replyTo = () => process.env.STORE_ALERT_EMAIL || STORE.email;
export const statusLink = (r: Pick<ReturnRow, "reference" | "access_token">) => `${STORE.url}/returns/status/${r.reference}?t=${r.access_token}`;

const wrap = (name: string, body: string, r: ReturnRow) =>
  `<p>Hi ${esc(name.split(" ")[0])},</p>${body}<p><a href="${statusLink(r)}">View your request</a></p>` +
  `<p style="color:#666;font-size:13px">Please allow around ${RETURNS.processDays} days for the full process. We will keep you updated by email. To reply to us, simply reply to this email.</p><p>Crolina — ${STORE.tagline}</p>`;

export async function emailReturnReceived(r: ReturnRow) {
  const items = r.items.map((i) => `<li>${i.quantity} × ${esc(i.product_name)}</li>`).join("");
  await sendEmail(r.customer_email, `We received your request ${r.reference}`,
    wrap(r.customer_name, `<p>We received your request <b>${r.reference}</b> for order <b>${r.order_reference}</b> (${esc(typeLabel(r.request_type))}).</p><ul>${items}</ul><p>Every request is reviewed and approved by our team before anything happens. Please do not send any item back until we approve your request and confirm how to return it.</p>`, r), replyTo());
  await sendEmail(process.env.STORE_ALERT_EMAIL || "", `New return request ${r.reference} (${r.order_reference})`,
    `<p>New <b>${esc(typeLabel(r.request_type))}</b> request <b>${r.reference}</b> for order ${r.order_reference} from ${esc(r.customer_name)} (${esc(r.customer_email)}).</p><p>Reason: ${esc(reasonLabel(r.reason))}</p><p><a href="${STORE.url}/admin/returns/${r.id}">Open in admin</a></p>`, r.customer_email);
}

/** Email the customer a status update written by the admin. Returns true if the email was accepted. */
export async function emailReturnUpdate(r: ReturnRow, message: string) {
  const meta = returnStatusMeta(r.status);
  const extra = r.status === "approved"
    ? `<p><b>Next step:</b> open your request and choose how the item will get back to us: we collect it from you, or you send it to our address.</p>`
    : r.status === "completed" && r.refund_amount_zar != null
      ? `<p>Refund amount: <b>R${Number(r.refund_amount_zar).toFixed(2)}</b>. Refunds are paid to your original payment method where possible.</p>` : "";
  return sendEmail(r.customer_email, `Your request ${r.reference}: ${meta.label}`,
    wrap(r.customer_name, `<p>Status of request <b>${r.reference}</b>: <b>${meta.label}</b>.</p>${message ? `<p>${para(message)}</p>` : `<p>${esc(meta.customer)}</p>`}${extra}`, r), replyTo());
}

export async function emailReturnMethodChosen(r: ReturnRow) {
  const how = r.return_method === "collection" ? "Collection from your address" : "You send the item to our address";
  await sendEmail(r.customer_email, `Return method confirmed for ${r.reference}`,
    wrap(r.customer_name, `<p>You chose: <b>${how}</b>. We will email you the details${r.return_method === "collection" ? " and the collection date" : ""}.</p>`, r), replyTo());
  await sendEmail(process.env.STORE_ALERT_EMAIL || "", `Return method chosen for ${r.reference}`,
    `<p>${esc(r.customer_name)} chose <b>${how}</b> for ${r.reference}.</p><p><a href="${STORE.url}/admin/returns/${r.id}">Open in admin</a></p>`, r.customer_email);
}
