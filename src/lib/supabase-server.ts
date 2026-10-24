import { createClient } from "@supabase/supabase-js";
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server Supabase environment variables are missing.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function requireAdmin(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");
  const supabase = createServiceClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) throw new Error("UNAUTHORIZED");
  const { data: admin, error } = await supabase.from("admin_users").select("user_id,email").eq("user_id", authData.user.id).maybeSingle();
  if (error || !admin || admin.email.toLowerCase() !== (authData.user.email || "").toLowerCase() || (authData.user.email || "").toLowerCase() !== "daltonfelizarda66@gmail.com") throw new Error("FORBIDDEN");
  return { supabase, user: authData.user, admin };
}
export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return Response.json({ error: "Please sign in again." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "Administrator access required." }, { status: 403 });
  console.error(error);
  return Response.json({ error: "Server configuration or request error." }, { status: 500 });
}
