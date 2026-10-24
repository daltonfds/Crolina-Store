import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function Header() {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const message = encodeURIComponent("Hello Crolina Shop, I have a question about your products.");
  return <>
    <div className="topbar">Essential electronics · Trusted shopping · Delivery across South Africa</div>
    <header className="header"><div className="container nav">
      <Link className="brand-lockup" href="/" aria-label="Crolina Shop home">
        <span className="brand-badge">CS</span><span className="brand-copy"><strong>CROLINA SHOP</strong><small>Essential Electronics | South Africa</small></span>
      </Link>
      <nav aria-label="Main navigation"><a href="/#categories">Categories</a><a href="/#products">Products</a><a href="/#help">Help</a></nav>
      <a className="button primary" href={`https://wa.me/${number}?text=${message}`} target="_blank" rel="noreferrer">Chat to us <MessageCircle size={16}/></a>
    </div></header>
  </>;
}
