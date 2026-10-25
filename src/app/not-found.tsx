import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-medium">404</p>
      <p className="text-muted">We couldn&apos;t find that page.</p>
      <Link href="/" className="btn btn-primary">Back to Crolina</Link>
    </main>
  );
}
