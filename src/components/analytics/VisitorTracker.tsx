"use client";

import { useEffect } from "react";

const KEY_VISITOR = "crolina_visitor_id";
const KEY_SESSION = "crolina_session_id";
const KEY_STARTED = "crolina_session_started";
const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function VisitorTracker() {
  useEffect(() => {
    try {
      let visitorId = localStorage.getItem(KEY_VISITOR);
      if (!visitorId) { visitorId = makeId(); localStorage.setItem(KEY_VISITOR, visitorId); }
      let sessionId = sessionStorage.getItem(KEY_SESSION);
      if (!sessionId) { sessionId = makeId(); sessionStorage.setItem(KEY_SESSION, sessionId); sessionStorage.setItem(KEY_STARTED, String(Date.now())); }
      const url = new URL(window.location.href);
      const referral = url.searchParams.get("ref");
      if (referral && /^[a-z0-9_-]{3,40}$/i.test(referral)) {
        localStorage.setItem("crolina_affiliate_code", referral);
        document.cookie = `crolina_affiliate=${encodeURIComponent(referral)}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`;
        fetch("/api/affiliates/click", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({ code: referral, visitor_id: visitorId, session_id: sessionId, landing_path: url.pathname + url.search, referrer: document.referrer || null }) }).catch(() => undefined);
      }
      const send = (event_type: string, extra: Record<string, unknown> = {}) => {
        const started = Number(sessionStorage.getItem(KEY_STARTED) || Date.now());
        fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({
          visitor_id: visitorId, session_id: sessionId, event_type, path: window.location.pathname + window.location.search,
          page_title: document.title.slice(0, 200), referrer: document.referrer || undefined,
          affiliate_code: localStorage.getItem("crolina_affiliate_code") || undefined,
          duration_seconds: Math.max(0, Math.floor((Date.now() - started) / 1000)), metadata: extra
        }) }).catch(() => undefined);
      };
      send(window.location.pathname.startsWith("/checkout") ? "checkout_started" : "page_view");
      const startedAt = Date.now();
      const heartbeat = window.setInterval(() => {
        fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({
          visitor_id: visitorId, session_id: sessionId, event_type: "page_view", path: window.location.pathname + window.location.search,
          page_title: document.title.slice(0, 200), duration_seconds: Math.floor((Date.now() - startedAt) / 1000),
          affiliate_code: localStorage.getItem("crolina_affiliate_code") || undefined, metadata: { heartbeat: true }
        }) }).catch(() => undefined);
      }, 30000);
      const onHide = () => send("page_view", { final_duration_seconds: Math.floor((Date.now() - startedAt) / 1000), page_exit: true });
      window.addEventListener("pagehide", onHide);
      return () => { clearInterval(heartbeat); window.removeEventListener("pagehide", onHide); };
    } catch { /* analytics must never interrupt shopping */ }
  }, []);
  return null;
}
