"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type AnalyticsEvent = {
  event_type: "page_view" | "product_view" | "add_to_cart" | "checkout_started" | "order_placed";
  path: string;
  page_title?: string;
  product_name?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
};

function getId(key: string) {
  try {
    let value = localStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return crypto.randomUUID();
  }
}

export async function trackStoreEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const visitor_id = getId("crolina-visitor-id");
  let session_id = "";
  try {
    session_id = sessionStorage.getItem("crolina-session-id") || "";
    if (!session_id) {
      session_id = crypto.randomUUID();
      sessionStorage.setItem("crolina-session-id", session_id);
    }
  } catch {
    session_id = crypto.randomUUID();
  }
  const query = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach((key) => {
    const value = query.get(key);
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
        ...event,
        referrer: event.referrer || document.referrer || undefined,
        metadata: { ...attribution, ...(event.metadata || {}) },
      }),
    });
  } catch {
    // Analytics must never interrupt shopping or checkout.
  }
}

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    const path = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    const title = document.title.replace(/\s*\|\s*Crolina.*$/i, "").trim();
    const productPath = pathname.match(/^\/product\/([^/]+)/);
    const base = { path, page_title: title, referrer: document.referrer || undefined };
    void trackStoreEvent({ event_type: "page_view", ...base });
    if (productPath) {
      void trackStoreEvent({ event_type: "product_view", ...base, product_name: title || decodeURIComponent(productPath[1]).replaceAll("-", " ") });
    }
    if (pathname === "/checkout") void trackStoreEvent({ event_type: "checkout_started", ...base });
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a, input[type=submit]");
      if (!control) return;
      const label = (control.textContent || control.getAttribute("aria-label") || "").toLowerCase();
      if (!/(add to bag|add to cart|add to basket|add item)/.test(label)) return;
      const card = control.closest("article, [data-product-card], .group") || control.parentElement?.parentElement;
      const productName = card?.querySelector("h1,h2,h3,[data-product-name]")?.textContent?.trim()
        || document.querySelector("h1")?.textContent?.trim()
        || document.title;
      void trackStoreEvent({
        event_type: "add_to_cart",
        path: window.location.pathname + window.location.search,
        page_title: document.title,
        product_name: productName,
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

export default function AnalyticsTracker() {
  return <Suspense fallback={null}><AnalyticsTrackerInner /></Suspense>;
}
