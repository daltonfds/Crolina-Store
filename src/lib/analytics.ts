"use client";

export type StoreAnalyticsEvent = {
  event_type: "page_view" | "product_view" | "add_to_cart" | "checkout_started" | "checkout_completed" | "order_placed" | "cookie_accepted" | "exit_prompt_opened";
  path?: string;
  page_title?: string;
  product_id?: string;
  product_name?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
};

function getId(key: string) {
  try {
    let value = localStorage.getItem(key);
    if (!value) {
      value = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export async function trackStoreEvent(event: StoreAnalyticsEvent) {
  if (typeof window === "undefined") return;
  const visitor_id = getId("crolina-visitor-id");
  let session_id = "";
  try {
    session_id = sessionStorage.getItem("crolina-session-id") || "";
    if (!session_id) {
      session_id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("crolina-session-id", session_id);
    }
  } catch {
    session_id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const params = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(key => {
    const value = params.get(key);
    if (value) attribution[key] = value;
  });
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitor_id,
        session_id,
        event_type: event.event_type,
        path: event.path || (window.location.pathname + window.location.search),
        page_title: event.page_title || document.title,
        product_id: event.product_id,
        product_name: event.product_name,
        referrer: event.referrer || document.referrer || undefined,
        metadata: { ...attribution, ...(event.metadata || {}) },
      }),
    });
  } catch {
    // Analytics must never interrupt shopping or checkout.
  }
}
