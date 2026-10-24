import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Crolina Store | Smart everyday tech", description: "Shop Kindles, smartwatches, power banks, TWS earphones and mini UPS devices in South Africa.", metadataBase: new URL("https://www.crolina.shop") };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-ZA"><body>{children}</body></html>; }
