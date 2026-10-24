import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function Header() {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const message = encodeURIComponent("Hello Crolina, I have a question about your products.");
  return <>
    <div className="topbar">Free delivery over R 800 · Thoughtful finds for every day</div>
    <header className="header"><div className="container nav">
      <Link className="brand-lockup" href="/" aria-label="Crolina home">
        <span className="brand-copy"><strong>Crolina</strong><small>Shop</small></span>
      </Link>
      <nav aria-label="Main navigation"><a href="/#products">Shop</a><a href="/#categories">Categories</a><a href="/#help">Help</a></nav>
      {number ? <a className="button primary" href={`https://wa.me/${number}?text=${message}`} target="_blank" rel="noreferrer">Chat to us <MessageCircle size={16}/></a> : <Link className="button primary" href="/#products">Shop the collection</Link>}
    </div></header>
  </>;
}
