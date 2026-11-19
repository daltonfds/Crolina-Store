"use client";

export type ReliefEvent = "relief_started" | "relief_plan_shown" | "relief_upsell" | "relief_whatsapp_click";

// Same keys as VisitorTracker, so relief events land in the same visitor journey in the admin.
const VISITOR_KEY = "crolina_visitor_id";
const SESSION_KEY = "crolina_session_id";
const SESSION_STARTED_KEY = "crolina_session_started";

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function trackRelief(event: ReliefEvent, metadata: Record<string, unknown> = {}, summary?: string) {
  if (typeof window === "undefined") return;
  try {
    const visitor_id = localStorage.getItem(VISITOR_KEY) || makeId();
    localStorage.setItem(VISITOR_KEY, visitor_id);
    const session_id = sessionStorage.getItem(SESSION_KEY) || makeId();
    sessionStorage.setItem(SESSION_KEY, session_id);
    const startedAt = Number(sessionStorage.getItem(SESSION_STARTED_KEY) || Date.now());

    const params = new URLSearchParams(window.location.search);
    const attribution: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach((k) => {
      const v = params.get(k);
      if (v) attribution[k] = v;
    });

    fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitor_id,
        session_id,
        event_type: event,
        path: window.location.pathname + window.location.search,
        page_title: document.title.slice(0, 200),
        product_name: summary ? summary.slice(0, 200) : undefined,
        referrer: document.referrer || undefined,
        affiliate_code: localStorage.getItem("crolina_affiliate_code") || undefined,
        duration_seconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
        metadata: { ...attribution, ...metadata },
      }),
    }).catch(() => undefined);
  } catch {
    // Tracking must never interrupt the conversation.
  }
}

/** Fires a Meta Pixel event if the Pixel is installed on the page. Safe no-op otherwise. */
export function pixel(event: string, params?: Record<string, unknown>) {
  try {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (fbq) fbq("track", event, params);
  } catch {
    // ignore
  }
}
