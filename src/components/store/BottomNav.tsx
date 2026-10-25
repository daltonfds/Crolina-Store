"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/shop", label: "Categories", Icon: LayoutGrid },
  { href: "/favorites", label: "Favorites", Icon: Heart },
  { href: "/account", label: "Account", Icon: User },
];

export default function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/checkout") || path.startsWith("/order")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white md:hidden" aria-label="Main">
      <ul className="flex justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} className={cn("flex w-20 flex-col items-center gap-0.5 py-2 text-[11px]", active ? "text-ink" : "text-muted")}>
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
