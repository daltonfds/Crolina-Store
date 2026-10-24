import type { Metadata } from "next";
import "./globals.css";
import "./gallery.css";
import CookieConsent from "@/components/cookie-consent";
export const metadata: Metadata = { title: "Crolina Shop | Essential Electronics | South Africa", description: "Crolina Shop — essential electronics in South Africa. Shop Kindles, smartwatches, power banks, TWS earphones and mini UPS devices.", metadataBase: new URL(process.env.NEXT_PUBLIC_STORE_URL||"https://www.crolina.shop") };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-ZA"><body>{children}<CookieConsent/></body></html>}
