import { requireAdmin, authErrorResponse } from "@/lib/supabase-server";
export async function GET(request:Request){try{const {admin}=await requireAdmin(request);return Response.json({admin});}catch(e){return authErrorResponse(e);}}
