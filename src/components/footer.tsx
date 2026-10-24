import Link from "next/link";

export default function Footer() {
  return <footer><div className="container footer">
    <span>© {new Date().getFullYear()} Crolina Shop. All rights reserved.</span>
    <span>South Africa · ZAR</span>
    <span><Link href="/privacy">Privacy</Link> · <Link href="/returns">Returns &amp; warranty</Link> · <Link href="/terms">Terms</Link> · <Link href="/checkout/proof">Upload payment proof</Link></span>
  </div></footer>;
}
