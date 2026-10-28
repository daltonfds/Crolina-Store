"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/shop", label: "Shop", key: "shop" },
  { href: "/categories", label: "Categories", key: "categories" },
  { href: "/shop?sale=1", label: "On sale", key: "sale" },
  { href: "/account", label: "Track", key: "track" },
];

function Tabs() {
  const path = usePathname();
  const sale = useSearchParams().get("sale") === "1";
  if (path.startsWith("/checkout") || path.startsWith("/order")) return null;
  const activeKey = path === "/" ? "home" : path.startsWith("/categories") ? "categories"
    : path.startsWith("/shop") ? (sale ? "sale" : "shop") : path.startsWith("/account") ? "track" : "";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white md:hidden" aria-label="Main">
      <ul className="flex justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, key }) => (
          <li key={key}>
            <Link href={href} className={cn("flex h-14 w-[4.6rem] items-center justify-center text-[11px] uppercase tracking-wide", activeKey === key ? "font-semibold text-ink" : "text-muted")}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function BottomNav() {
  return <Suspense fallback={null}><Tabs /></Suspense>;
}
