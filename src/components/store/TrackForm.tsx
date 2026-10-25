"use client";
import { useRouter } from "next/navigation";

export default function TrackForm() {
  const router = useRouter();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const ref = String(new FormData(e.currentTarget).get("ref") ?? "").trim().toUpperCase();
        if (ref) router.push(`/order/${encodeURIComponent(ref)}`);
      }}
    >
      <input name="ref" placeholder="CR-XXXXXXXXXX" required className="field" />
      <button className="btn btn-primary shrink-0">Track</button>
    </form>
  );
}
