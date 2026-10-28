"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Receipt, Route, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/orders", label: "Orders", Icon: Receipt },
  { href: "/admin/visitors", label: "Journeys", Icon: Route },
  { href: "/admin/contacts", label: "Contacts", Icon: Users },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export default function AdminNav({ vertical = false }: { vertical?: boolean }) {
  const path = usePathname();
  return (
    <ul className={cn(vertical ? "flex flex-col gap-1" : "flex justify-around pb-[env(safe-area-inset-bottom)]")}>
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                vertical ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm" : "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? (vertical ? "bg-ink text-white" : "text-ink") : "text-muted hover:text-ink",
              )}
            >
              <Icon size={vertical ? 18 : 22} strokeWidth={1.5} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
