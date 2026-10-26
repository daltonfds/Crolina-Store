import CheckoutForm from "@/components/store/CheckoutForm";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { data } = await createServiceClient()
    .from("bank_details").select("id").eq("is_active", true).not("payment_link_url", "is", null).limit(1);
  return (
    <div>
      <h1 className="mb-5 text-2xl font-medium">Checkout</h1>
      <CheckoutForm storeLinkAvailable={(data?.length ?? 0) > 0} />
    </div>
  );
}