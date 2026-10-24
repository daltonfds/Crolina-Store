import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./gallery.css";
import CookieConsent from "@/components/cookie-consent";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", weight: ["400", "500"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", weight: ["600"] });

export const metadata: Metadata = {
  title: "Crolina Shop | Style for every day",
  description: "Discover thoughtfully selected products at Crolina Shop. Shop online in South Africa with prices in ZAR.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_STORE_URL || "https://www.crolina.shop"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-ZA"><body className={`${inter.variable} ${playfair.variable}`}>{children}<CookieConsent /></body></html>;
}
