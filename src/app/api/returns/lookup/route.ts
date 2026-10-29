import { NextResponse } from "next/server";
import { NOT_FOUND, fail, findOrder } from "@/lib/returns-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const found = await findOrder(String(body?.reference ?? ""), String(body?.email ?? ""));
  if (!found) return fail(NOT_FOUND, 404);
  if (found.openRequest) return fail(`There is already an open request for this order (${found.openRequest}). Check your email for its link.`, 409);
  if (!found.eligible) return fail("This order is not eligible for a return request yet. Requests can be made once the order is paid.", 409);
  return NextResponse.json({
    order: found.order.order_reference,
    items: found.items.map((i) => ({ id: i.id, name: i.product_name, quantity: i.quantity })),
  });
}
