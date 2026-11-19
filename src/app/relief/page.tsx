import type { Metadata } from "next";
import ReliefChat from "@/components/relief/ReliefChat";

export const metadata: Metadata = {
  title: { absolute: "Pain relief support" },
  description: "Find a personal muscle and joint relief plan. Free delivery across South Africa.",
  robots: { index: false, follow: false },
};

export default function ReliefPage() {
  return <ReliefChat />;
}
