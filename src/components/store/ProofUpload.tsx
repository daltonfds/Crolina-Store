"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";

export default function ProofUpload({ reference }: { reference: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("File is too large (max 4 MB)."); return; }
    setBusy(true); setError("");
    const fd = new FormData();
    fd.set("reference", reference);
    fd.set("file", file);
    const res = await fetch("/api/proof", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || "Upload failed. Please try again."); return; }
    router.refresh();
  }

  return (
    <div>
      <label className="btn btn-outline w-full cursor-pointer">
        <Upload size={18} /> {busy ? "Uploading…" : "Upload proof of payment"}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" disabled={busy} onChange={onChange} />
      </label>
      <p className="mt-2 text-xs text-muted">JPG, PNG, WebP or PDF, up to 4 MB.</p>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
