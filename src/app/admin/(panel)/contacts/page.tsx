import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  await requireAdmin();
  const service = createServiceClient();
  const { data, error } = await service
    .from("store_marketing_contacts")
    .select("id,name,email,whatsapp,source,marketing_consent,consented_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const contacts = data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-medium">Saved contacts</h1>
        <p className="mt-1 text-sm text-muted">Emails, names and phone/WhatsApp numbers submitted by visitors.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs text-muted">Total contacts</p>
          <p className="mt-1 text-2xl font-medium">{contacts.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs text-muted">With phone number</p>
          <p className="mt-1 text-2xl font-medium">{contacts.filter(c => c.whatsapp).length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs text-muted">Marketing opt-in</p>
          <p className="mt-1 text-2xl font-medium">{contacts.filter(c => c.marketing_consent).length}</p>
        </div>
      </div>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">Could not load contacts. Check the Supabase connection and migration.</div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">No contact details have been saved yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone / WhatsApp</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Marketing consent</th>
                <th className="px-4 py-3 font-medium">Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contacts.map(contact => (
                <tr key={contact.id}>
                  <td className="px-4 py-3 font-medium">{contact.name || "—"}</td>
                  <td className="px-4 py-3"><a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a></td>
                  <td className="px-4 py-3">{contact.whatsapp ? <a className="underline" href={`tel:${contact.whatsapp}`}>{contact.whatsapp}</a> : "—"}</td>
                  <td className="px-4 py-3 capitalize">{contact.source.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${contact.marketing_consent ? "bg-soft-green text-deep-green" : "bg-soft-sand text-deep-sand"}`}>{contact.marketing_consent ? "Opted in" : "Not opted in"}</span></td>
                  <td className="px-4 py-3 text-muted">{new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" }).format(new Date(contact.created_at))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">Showing up to 1,000 contacts. Only contact people for marketing if they explicitly opted in.</p>
        </div>
      )}
    </div>
  );
}
