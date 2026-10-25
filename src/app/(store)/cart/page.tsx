"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartLines, CartTotals } from "@/components/store/CartLines";
import { useCart, useMounted } from "@/lib/cart";

export default function CartPage() {
  const mounted = useMounted();
  const lines = useCart((s) => s.lines);
  if (!mounted) return <div className="h-64" />;
  if (lines.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <ShoppingBag size={44} strokeWidth={1.25} className="text-muted" />
        <h1 className="text-xl font-medium">Your bag is empty</h1>
        <p className="text-sm text-muted">Let&apos;s fix that.</p>
        <Link href="/shop" className="btn btn-primary">Shop collection</Link>
      </div>
    );
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_22rem]">
      <div><h1 className="mb-2 text-2xl font-medium">Your bag</h1><CartLines /></div>
      <aside className="card h-fit space-y-4 p-5">
        <CartTotals lines={lines} />
        <Link href="/checkout" className="btn btn-primary w-full">Checkout</Link>
        <Link href="/shop" className="block text-center text-sm text-muted underline">Continue shopping</Link>
      </aside>
    </div>
  );
}
