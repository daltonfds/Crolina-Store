"use client";

import { useEffect } from "react";

const VISITOR_KEY = "crolina_visitor_id";
const SESSION_KEY = "crolina_session_id";
const SESSION_STARTED_KEY = "crolina_session_started";

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function VisitorTracker() {
  useEffect(() => {
    let visitorId: string;
    let sessionId: string;

    try {
      visitorId = localStorage.getItem(VISITOR_KEY) || makeId();
      localStorage.setItem(VISITOR_KEY, visitorId);

      sessionId = sessionStorage.getItem(SESSION_KEY) || makeId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
      if (!sessionStorage.getItem(SESSION_STARTED_KEY)) {
        sessionStorage.setItem(SESSION_STARTED_KEY, String(Date.now()));
      }

      document.cookie = `crolina_session_id=${encodeURIComponent(sessionId)}; Path=/; Max-Age=86400; SameSite=Lax; Secure`;

      const url = new URL(window.location.href);
      const referral = url.searchParams.get("ref");
      if (referral && /^[a-z0-9_-]{3,40}$/i.test(referral)) {
        localStorage.setItem("crolina_affiliate_code", referral);
        document.cookie = `crolina_affiliate=${encodeURIComponent(referral)}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`;
        fetch("/api/affiliate-click", {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            code: referral,
            visitor_id: visitorId,
            session_id: sessionId,
            landing_path: url.pathname + url.search,
            referrer: document.referrer || null,
          }),
        }).catch(() => undefined);
      }

      const send = (eventType: string, metadata: Record<string, unknown> = {}) => {
        const startedAt = Number(sessionStorage.getItem(SESSION_STARTED_KEY) || Date.now());
        fetch("/api/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            visitor_id: visitorId,
            session_id: sessionId,
            event_type: eventType,
            path: window.location.pathname + window.location.search,
            page_title: document.title.slice(0, 200),
            referrer: document.referrer || undefined,
            affiliate_code: localStorage.getItem("crolina_affiliate_code") || undefined,
            duration_seconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
            metadata,
          }),
        }).catch(() => undefined);
      };

      send(window.location.pathname.startsWith("/checkout") ? "checkout_started" : "page_view");
      const pageStartedAt = Date.now();
      const heartbeat = window.setInterval(() => {
        send("page_view", {
          heartbeat: true,
          page_duration_seconds: Math.floor((Date.now() - pageStartedAt) / 1000),
        });
      }, 30000);

      const onPageHide = () => {
        send("page_view", {
          page_exit: true,
          final_duration_seconds: Math.floor((Date.now() - pageStartedAt) / 1000),
        });
      };

      const captureCheckoutRecovery = () => {
        if (!window.location.pathname.startsWith("/checkout")) return;

        const consent = Array.from(
          document.querySelectorAll('input[type="checkbox"]'),
        ).find((element) => {
          const input = element as HTMLInputElement;
          return /consent|marketing|offers/i.test(
            input.name + " " + input.id + " " + input.value,
          );
        }) as HTMLInputElement | undefined;

        if (!consent?.checked) return;

        const email = (document.querySelector('input[type="email"]') as HTMLInputElement | null)?.value.trim();
        const phone = (document.querySelector('input[type="tel"]') as HTMLInputElement | null)?.value.trim();
        const name = (document.querySelector('input[autocomplete="name"], input[name*="name" i]') as HTMLInputElement | null)?.value.trim();

        if (!email && !phone) return;

        fetch("/api/checkout-recovery", {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            visitor_id: visitorId,
            session_id: sessionId,
            contact_email: email || undefined,
            contact_phone: phone || undefined,
            customer_name: name || undefined,
            checkout_path: window.location.pathname,
            affiliate_code: localStorage.getItem("crolina_affiliate_code") || undefined,
            marketing_consent: true,
            cart_snapshot: [],
          }),
        }).catch(() => undefined);
      };

      document.addEventListener("change", captureCheckoutRecovery);
      document.addEventListener("blur", captureCheckoutRecovery, true);
      window.addEventListener("pagehide", onPageHide);

      return () => {
        document.removeEventListener("change", captureCheckoutRecovery);
        document.removeEventListener("blur", captureCheckoutRecovery, true);
        window.clearInterval(heartbeat);
        window.removeEventListener("pagehide", onPageHide);
      };
    } catch {
      // Analytics must never interrupt the shopping experience.
    }
  }, []);

  return null;
}
