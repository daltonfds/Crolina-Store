import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import VisitorJourneysView from "@/components/admin/VisitorJourneysView";

export const dynamic = "force-dynamic";

export default async function AdminVisitorsPage() {
  await requireAdmin();
  const { data, error } = await createServiceClient()
    .from("store_visitor_events")
    .select("id,visitor_id,session_id,event_type,path,page_title,product_name,referrer,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return <div className="rounded-2xl border border-line bg-white p-6"><h1 className="text-lg font-medium">Visitor journeys</h1><p className="mt-2 text-sm text-muted">Analytics data could not be loaded. Confirm the analytics migrations have been applied in Supabase.</p></div>;
  }

  return <VisitorJourneysView events={data ?? []} />;
}
