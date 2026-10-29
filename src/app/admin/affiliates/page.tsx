import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import AffiliateStatusControl from "@/components/admin/AffiliateStatusControl";
export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliate management", robots: { index: false, follow: false } };
export default async function AffiliateManagementPage() {
 const auth=await createClient(); const {data:{user}}=await auth.auth.getUser(); if(!user)redirect("/admin/login");
 const {data:admin}=await auth.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!admin)return <main className="p-8"><h1 className="text-2xl font-semibold">Access denied</h1></main>;
 const {data:affiliates}=await createServiceClient().from("store_affiliates").select("id,name,email,phone,code,status,commission_percent,created_at").order("created_at",{ascending:false});
 return <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-900 md:px-8"><div className="mx-auto max-w-6xl"><a href="/admin/analytics" className="text-sm underline">← Visitor insights</a><h1 className="mt-4 text-3xl font-semibold">Affiliate management</h1><p className="mt-2 text-sm text-neutral-600">Review applications, approve affiliates, and pause links when needed.</p><div className="mt-6 overflow-x-auto rounded-2xl border bg-white p-4"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-neutral-500"><th className="py-3">Name</th><th>Email / phone</th><th>Referral code</th><th>Commission</th><th>Status and actions</th></tr></thead><tbody>{(affiliates??[]).map(a=><tr className="border-b border-neutral-100" key={a.id}><td className="py-3 font-medium">{a.name}</td><td>{a.email}<br/>{a.phone||"—"}</td><td><code>{a.code}</code></td><td>{a.commission_percent}%</td><td><AffiliateStatusControl id={a.id} status={a.status}/></td></tr>)}</tbody></table>{!affiliates?.length&&<p className="py-6 text-sm text-neutral-500">No applications yet.</p>}</div></div></main>;
}
