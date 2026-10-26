"use client";
import { useEffect, useState } from "react";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { STORE } from "@/lib/config";
import { cn } from "@/lib/utils";

const CARDS = [
  { Icon: Truck, title: "Delivery across South Africa", text: `Free over R ${STORE.freeShippingOver}, otherwise a flat R ${STORE.shippingFlat}. Delivered in ${STORE.deliveryTime}, nationwide.` },
  { Icon: RotateCcw, title: "7-day returns", text: "For incorrect, damaged or faulty items, subject to assessment." },
  { Icon: ShieldCheck, title: "Order with confidence", text: "Pay by EFT and upload your proof. We confirm every order personally." },
];

export default function HeroCards() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % CARDS.length), 4500);
    return () => clearInterval(t);
  }, [paused]);
  const { Icon, title, text } = CARDS[i];
  return (
    <div
      className="w-full max-w-xl rounded-2xl border border-blue-100/80 bg-[#f8fbff] p-3 shadow-sm sm:p-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 6000)}
    >
      <div key={i} className="card-in flex min-h-[5.5rem] items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-deep-blue"><Icon size={20} strokeWidth={1.75} /></span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-sm text-muted">{text}</p>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        {CARDS.map((c, n) => (
          <button key={c.title} type="button" aria-label={`Show: ${c.title}`} onClick={() => setI(n)}
            className={cn("h-1.5 rounded-full transition-all", n === i ? "w-6 bg-ink" : "w-1.5 bg-ink/25")} />
        ))}
      </div>
    </div>
  );
}