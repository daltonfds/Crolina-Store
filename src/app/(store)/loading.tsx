export default function StoreLoading() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-6" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-36 animate-pulse rounded-lg bg-surface" />
      <div className="h-11 w-full animate-pulse rounded-full bg-surface" />
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-surface" />)}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-surface" />
            <div className="h-4 w-full animate-pulse rounded bg-surface" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
