import { Mail } from "lucide-react";
import { STORE, facebookUrl, instagramUrl, whatsappUrl } from "@/lib/config";

type IconProps = { size?: number; className?: string };

export function InstagramIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20.5 11.9a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 20.5 11.9z" />
      <path d="M9.3 8.3c-.3.3-.5.8-.4 1.3.4 2 2.4 4 4.5 4.6.6.1 1.1 0 1.4-.4l.5-.7a.6.6 0 0 0-.1-.8l-1.3-.8a.6.6 0 0 0-.7.1l-.5.5a3.9 3.9 0 0 1-1.7-1.7l.5-.5a.6.6 0 0 0 .1-.7l-.8-1.3a.6.6 0 0 0-.8-.1z" />
    </svg>
  );
}

export default function SocialLinks() {
  const wa = whatsappUrl("Hi Crolina, I have a question.");
  const items = [
    { href: instagramUrl, label: "Instagram", value: `@${STORE.instagram}`, Icon: InstagramIcon },
    { href: facebookUrl, label: "Facebook", value: STORE.facebook, Icon: FacebookIcon },
    ...(wa ? [{ href: wa, label: "WhatsApp", value: `+${STORE.whatsapp}`, Icon: WhatsAppIcon }] : []),
    { href: `mailto:${STORE.email}`, label: "Email", value: STORE.email, Icon: Mail },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map(({ href, label, value, Icon }) => (
        <li key={label}>
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white"><Icon size={20} /></span>
            <span className="min-w-0 text-sm"><span className="block text-xs text-muted">{label}</span><span className="block truncate">{value}</span></span>
          </a>
        </li>
      ))}
    </ul>
  );
}