import { requireAdmin } from "@/lib/auth";
import { STORE } from "@/lib/config";
import { saveBankDetails } from "../../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { sb } = await requireAdmin();
  const { data: b } = await sb.from("bank_details").select("*").limit(1).maybeSingle();
  const Field = ({ name, label, area }: { name: string; label: string; area?: boolean }) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {area ? <textarea id={name} name={name} rows={3} defaultValue={b?.[name] ?? ""} className="field" /> : <input id={name} name={name} defaultValue={b?.[name] ?? ""} className="field" />}
    </div>
  );
  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-xl font-medium">Settings</h1>
      {(await searchParams).saved && <p className="rounded-xl bg-soft-green px-3 py-2 text-sm text-deep-green">Saved.</p>}
      <form action={saveBankDetails} className="card space-y-4 p-5">
        <h2 className="font-medium">Payment details shown to customers</h2>
        <Field name="account_name" label="Account name" />
        <Field name="bank_name" label="Bank" />
        <Field name="account_number" label="Account number" />
        <Field name="branch_code" label="Branch code" />
        <Field name="payment_link_url" label="Default payment link (PayFast, Paystack…) — used when a product has no link of its own" />
        <Field name="eft_instructions" label="Extra payment instructions (optional)" area />
        <button className="btn btn-primary w-full">Save settings</button>
      </form>
      <section className="card p-5 text-sm text-muted">
        <h2 className="mb-1 font-medium text-ink">Delivery</h2>
        <p>Flat R {STORE.shippingFlat}, free over R {STORE.freeShippingOver}. Change these in <code>src/lib/config.ts</code>.</p>
      </section>
    </div>
  );
}