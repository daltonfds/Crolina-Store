import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "./globals.css";
import { STORE } from "@/lib/config";
import VisitorTracker from "@/components/analytics/VisitorTracker";

export const metadata: Metadata = {
  metadataBase: new URL(STORE.url),
  title: { default: `${STORE.name} | ${STORE.tagline}`, template: `%s | ${STORE.name}` },
  description: "Essential goods delivered across South Africa. Prices in ZAR.",
  openGraph: { siteName: STORE.name, type: "website", locale: "en_ZA" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}
