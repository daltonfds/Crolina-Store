"use client";
import { useRef, useState } from "react";
import ProductThumb from "./ProductThumb";
import { cn } from "@/lib/utils";

type GalleryProduct = { id: string; name: string; category: string; image_urls: string[] };

export default function ProductGallery({ product, badge, dots = false }: { product: GalleryProduct; badge?: string; dots?: boolean }) {
  const urls: (string | null)[] = product.image_urls.length ? product.image_urls : [null];
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  function go(i: number) {
    setActive(i);
    track.current?.scrollTo({ left: track.current.clientWidth * i, behavior: "smooth" });
  }
  function onScroll() {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  }

  return (
    <div>
      <div className="relative -mx-4 md:mx-0">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto md:rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {urls.map((url, i) => (
            <div key={i} className="w-full shrink-0 snap-center">
              <ProductThumb
                product={{ id: product.id, name: product.name, category: product.category, image_urls: url ? [url] : [] }}
                className="aspect-square"
                iconSize={72}
              />
            </div>
          ))}
        </div>
        {badge && <span className={`absolute left-4 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm md:left-3 ${badge === "Single item" ? "bg-red-600 text-white" : "bg-white text-ink"}`}>{badge}</span>}
        {urls.length > 1 && (
          <span className="absolute bottom-3 right-4 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white md:right-3">
            {active + 1} / {urls.length}
          </span>
        )}
      </div>

      {dots && urls.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
          {urls.map((_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-ink" : "w-1.5 bg-line")} />)}
        </div>
      )}
      {urls.length > 1 && (
        <div className={cn("mt-3 gap-2 overflow-x-auto pb-1", dots ? "hidden md:flex" : "flex")}>
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => go(i)}
              className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2", i === active ? "border-ink" : "border-transparent opacity-70")}
            >
              {url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}