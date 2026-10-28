"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackStoreEvent as sendAnalyticsEvent, type StoreAnalyticsEvent } from "@/lib/analytics";

type EventType = StoreAnalyticsEvent["event_type"];

// Kept as a small compatibility wrapper for the cookie banner and exit offer.
export function trackStoreEvent(event_type: string, extra: Record<string, unknown> = {}) {
  const allowed: StoreAnalyticsEvent["event_type"][] = ["page_view", "product_view", "add_to_cart", "checkout_started", "checkout_completed", "order_placed", "cookie_accepted", "exit_prompt_opened"];
  if (!allowed.includes(event_type as EventType)) return;
  void sendAnalyticsEvent({
    event_type: event_type as EventType,
    metadata: (extra.metadata && typeof extra.metadata === "object" ? extra.metadata : {}) as Record<string, unknown>,
    product_name: typeof extra.product_name === "string" ? extra.product_name : undefined,
    product_id: typeof extra.product_id === "string" ? extra.product_id : undefined,
  });
}

export default function StoreAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const title = document.title.replace(/\s*\|\s*Crolina.*$/i, "").trim();
    const productMatch = pathname.match(/^\/product\/([^/]+)/);
    const eventBase = { path: pathname + window.location.search, page_title: title };
    void sendAnalyticsEvent({ event_type: "page_view", ...eventBase });
    if (productMatch) {
      let productName = title;
      if (!productName) {
        try { productName = decodeURIComponent(productMatch[1]).replaceAll("-", " "); } catch { productName = productMatch[1]; }
      }
      void sendAnalyticsEvent({ event_type: "product_view", ...eventBase, product_name: productName });
    }
    if (pathname === "/checkout") {
      void sendAnalyticsEvent({ event_type: "checkout_started", ...eventBase });
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button, a");
      if (!button) return;
      const label = (button.textContent || button.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 100);
      if (!/add to (bag|cart|basket)/i.test(label)) return;
      const productName = document.querySelector("h1")?.textContent?.trim() || document.title;
      void sendAnalyticsEvent({
        event_type: "add_to_cart",
        path: window.location.pathname + window.location.search,
        page_title: document.title,
        product_name: productName,
        metadata: { clicked_text: label },
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
