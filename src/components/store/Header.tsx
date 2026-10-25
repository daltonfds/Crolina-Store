"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { STORE, whatsappUrl } from "@/lib/config";
import { cartCount, useCart, useMounted } from "@/lib/cart";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/favorites", label: "Favorites" },
  { href: "/account", label: "Account & order tracking" },
  { href: "/returns", label: "Returns & warranty" },
];

export default function Header() {
  const [menu, setMenu] = useState(false);
  const mounted = useMounted();
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const count = mounted ? cartCount(lines) : 0;
  const wa = whatsappUrl("Hi Crolina, I have a question.");
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex w-[4.5rem] items-center">
            <button aria-label="Open menu" className="-ml-2 p-2 md:hidden" onClick={() => setMenu(true)}><Menu size={22} /></button>
            <nav className="hidden gap-5 text-sm md:flex">
              <Link href="/shop" className="hover:opacity-60">Shop</Link>
              <Link href="/favorites" className="hover:opacity-60">Favorites</Link>
            </nav>
          </div>
          <Link href="/" className="shrink-0 text-center leading-tight">
            <span className="block text-xl font-medium tracking-tight">{STORE.name}</span>
            <span className="block whitespace-nowrap text-[10px] text-muted">{STORE.tagline}</span>
          </Link>
          <div className="flex w-[4.5rem] items-center justify-end gap-1">
            <Link href="/shop?search=1" aria-label="Search" className="p-2"><Search size={22} /></Link>
            <button aria-label="Open bag" className="relative -mr-2 p-2" onClick={() => setOpen(true)}>
              <ShoppingBag size={22} />
              {count > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-white">{count}</span>
              )}
            </button>
          </div>
        </div>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-medium">{STORE.name}</span>
              <button aria-label="Close menu" onClick={() => setMenu(false)} className="p-2"><X size={22} /></button>
            </div>
            <nav className="flex flex-col">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenu(false)} className="border-b border-line py-3.5 text-base">{l.label}</Link>
              ))}
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="py-3.5 text-base">Chat on WhatsApp</a>}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
