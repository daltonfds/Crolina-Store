import { Check } from "lucide-react";

function withBold(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>);
}

export default function HelpsList({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 8);
  if (lines.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="mb-2 text-sm text-muted">Helps</p>
      <ul className="space-y-3">
        {lines.map((l, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] leading-snug">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-white"><Check size={13} strokeWidth={3} /></span>
            <span>{withBold(l)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}