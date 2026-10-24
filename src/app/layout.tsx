import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/cookie-consent";
export const metadata: Metadata = { title: "Crolina Store | Smart everyday tech", description: "Shop Kindles, smartwatches, power banks, TWS earphones and mini UPS devices in South Africa.", metadataBase: new URL(process.env.NEXT_PUBLIC_STORE_URL||"https://www.crolina.shop") };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-ZA"><body>{children}<CookieConsent/></body></html>}
