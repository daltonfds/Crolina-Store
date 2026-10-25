import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default function AdminLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <p className="text-2xl font-medium">Crolina</p>
          <p className="text-sm text-muted">Admin</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
