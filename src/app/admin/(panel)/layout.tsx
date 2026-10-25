import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white px-4">
        <Link href="/admin" className="flex items-baseline gap-1.5"><span className="text-lg font-medium">Crolina</span><span className="text-xs text-muted">Admin</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="hidden text-sm text-muted sm:block">View store</Link>
          <form action={logout}><button className="text-sm text-muted">Sign out</button></form>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-blue text-xs font-medium text-deep-blue">{(user.email ?? "CR").slice(0, 2).toUpperCase()}</span>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 md:py-8">
        <aside className="hidden w-48 shrink-0 md:block"><AdminNav vertical /></aside>
        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white md:hidden" aria-label="Admin"><AdminNav /></nav>
    </div>
  );
}
