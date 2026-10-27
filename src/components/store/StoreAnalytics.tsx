"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function id(key: string) {
  let value = localStorage.getItem(key);
  if (!value) {
    value = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, value);
  }
  return value;
}

export function trackStoreEvent(event_type: string, extra: Record<string, unknown> = {}) {
  try {
    const visitor_id = id("crolina-visitor-id");
    const session_id = sessionStorage.getItem("crolina-session-id") || (() => {
      const value = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("crolina-session-id", value);
      return value;
    })();
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitor_id, session_id, event_type, path: window.location.pathname + window.location.search,
        page_title: document.title, referrer: document.referrer || undefined, ...extra,
      }),
    }).catch(() => undefined);
  } catch { /* analytics must never interrupt shopping */ }
}

export default function StoreAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    trackStoreEvent((pathname.startsWith("/product/") || (pathname.startsWith("/shop/") && pathname !== "/shop")) ? "product_view" : pathname.startsWith("/order/") ? "checkout_completed" : "page_view");
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button, a");
      if (!button) return;
      const label = (button.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100);
      if (/add to (bag|cart)|add to basket/i.test(label)) {
        trackStoreEvent("add_to_cart", { metadata: { clicked_text: label } });
      }
      if (/checkout|place order|continue to payment/i.test(label)) {
        trackStoreEvent("checkout_started", { metadata: { clicked_text: label } });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
