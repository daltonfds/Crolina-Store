"use client";

function MastercardLogo() {
  return <svg viewBox="0 0 48 30" aria-hidden="true" className="h-6 w-10"><circle cx="18" cy="15" r="12" fill="#EB001B"/><circle cx="30" cy="15" r="12" fill="#F79E1B"/><path d="M24 5.8a12 12 0 0 1 0 18.4 12 12 0 0 1 0-18.4Z" fill="#FF5F00"/></svg>;
}

function VisaLogo() {
  return <svg viewBox="0 0 56 30" aria-hidden="true" className="h-6 w-12"><text x="2" y="22" fill="#1434CB" fontFamily="Arial,sans-serif" fontSize="22" fontWeight="700" fontStyle="italic">VISA</text></svg>;
}

function GooglePayLogo() {
  return <svg viewBox="0 0 30 30" aria-hidden="true" className="h-6 w-6"><path fill="#4285F4" d="M27 15.3c0-.9-.1-1.8-.3-2.6H15v4.9h6.7a5.7 5.7 0 0 1-2.5 3.7v3.1h4c2.4-2.2 3.8-5.4 3.8-9.1Z"/><path fill="#34A853" d="M15 27c3.4 0 6.2-1.1 8.2-2.9l-4-3.1c-1.1.7-2.5 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H4v3.2A12 12 0 0 0 15 27Z"/><path fill="#FBBC05" d="M8.1 17.1a7.2 7.2 0 0 1 0-4.6V9.3H4a12 12 0 0 0 0 11Z"/><path fill="#EA4335" d="M15 7.4c1.9 0 3.6.7 4.9 1.9l3.6-3.6A12 12 0 0 0 4 9.3l4.1 3.2c1-2.9 3.7-5.1 6.9-5.1Z"/></svg>;
}

function ApplePayLogo() {
  return <svg viewBox="0 0 26 30" aria-hidden="true" className="h-6 w-5 fill-current"><path d="M20.8 15.9c0-3 2.5-4.5 2.6-4.6a5.7 5.7 0 0 0-4.5-2.4c-1.9-.2-3.7 1.1-4.7 1.1s-2.5-1.1-4.1-1.1a6.1 6.1 0 0 0-5.1 3.1c-2.2 3.8-.6 9.4 1.5 12.5 1 1.5 2.2 3.2 3.8 3.1 1.5-.1 2.1-1 4-1s2.5 1 4.1 1c1.7 0 2.7-1.5 3.7-3.1a13.6 13.6 0 0 0 1.7-3.5 5.4 5.4 0 0 1-3-5.1ZM17.7 6.9A5.5 5.5 0 0 0 19 3a5.7 5.7 0 0 0-3.7 1.9 5.2 5.2 0 0 0-1.3 3.8 4.8 4.8 0 0 0 3.7-1.8Z"/></svg>;
}

function CapitecLogo() {
  return <svg viewBox="0 0 30 30" aria-hidden="true" className="h-6 w-6"><rect x="1" y="1" width="28" height="28" rx="14" fill="#E30613"/><path d="M19.9 10.5a7 7 0 1 0 0 9l-2.6-2.1a3.7 3.7 0 1 1 0-4.8Z" fill="#fff"/></svg>;
}

const METHODS = [
  { name: "Mastercard", icon: <MastercardLogo /> },
  { name: "Visa", icon: <VisaLogo /> },
  { name: "Google Pay", icon: <GooglePayLogo /> },
  { name: "Apple Pay", icon: <ApplePayLogo /> },
  { name: "Capitec Pay", icon: <CapitecLogo /> },
];

export default function PaymentMethodLogos() {
  return (
    <div aria-label="Payment methods that may be available through the payment link" className="mt-3 flex flex-wrap items-center gap-2">
      {METHODS.map(({ name, icon }) => (
        <span key={name} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-medium text-ink">
          {icon}<span>{name}</span>
        </span>
      ))}
    </div>
  );
}
