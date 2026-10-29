/** Returns, exchanges and refunds: shared rules, labels and status flow. */
export const RETURNS = { processDays: 15, maxPhotos: 4, maxPhotoBytes: 4 * 1024 * 1024 } as const;

/** Orders in these statuses can have a return request. */
export const RETURN_ELIGIBLE_ORDER_STATUSES = ["paid", "processing", "shipped", "completed"] as const;

export type ReturnStatus =
  | "submitted" | "under_review" | "info_requested" | "approved" | "rejected"
  | "awaiting_return" | "received" | "completed" | "cancelled";

export const RETURN_STATUSES: { value: ReturnStatus; label: string; badge: string; customer: string }[] = [
  { value: "submitted", label: "Submitted", badge: "bg-soft-sand text-deep-sand", customer: "We received your request. Our team will review it and reply by email." },
  { value: "under_review", label: "Under review", badge: "bg-soft-lilac text-deep-lilac", customer: "Your request is being reviewed. We will email you with the decision." },
  { value: "info_requested", label: "Information needed", badge: "bg-soft-sand text-deep-sand", customer: "We need more information. Please reply to our email." },
  { value: "approved", label: "Approved", badge: "bg-soft-green text-deep-green", customer: "Your request was approved. Choose how the item will get back to us." },
  { value: "rejected", label: "Declined", badge: "bg-soft-pink text-deep-pink", customer: "We could not approve this request. See our message below." },
  { value: "awaiting_return", label: "Waiting for the item", badge: "bg-soft-blue text-deep-blue", customer: "We are waiting for the item to arrive back with us (or to collect it)." },
  { value: "received", label: "Item received", badge: "bg-soft-blue text-deep-blue", customer: "We received the item and are inspecting it." },
  { value: "completed", label: "Completed", badge: "bg-soft-green text-deep-green", customer: "Your request is complete." },
  { value: "cancelled", label: "Cancelled", badge: "bg-soft-pink text-deep-pink", customer: "This request was cancelled." },
];
export const returnStatusMeta = (s: string) => RETURN_STATUSES.find((x) => x.value === s) ?? RETURN_STATUSES[0];

/** Statuses the admin can move to from each status. Everything needs an explicit admin decision. */
export const NEXT_STATUSES: Record<ReturnStatus, ReturnStatus[]> = {
  submitted: ["under_review", "info_requested", "approved", "rejected", "cancelled"],
  under_review: ["info_requested", "approved", "rejected", "cancelled"],
  info_requested: ["under_review", "approved", "rejected", "cancelled"],
  approved: ["awaiting_return", "cancelled"],
  awaiting_return: ["received", "cancelled"],
  received: ["completed", "info_requested", "rejected"],
  completed: [],
  rejected: [],
  cancelled: [],
};
/* Statuses where the admin must write a message to the customer. */
export const MESSAGE_REQUIRED: ReturnStatus[] = ["info_requested", "approved", "rejected", "awaiting_return"];
/* Statuses where the customer can still cancel the request themselves. */
export const CUSTOMER_CAN_CANCEL: ReturnStatus[] = ["submitted", "under_review", "info_requested", "approved"];
export const OPEN_STATUSES: ReturnStatus[] = ["submitted", "under_review", "info_requested", "approved", "awaiting_return", "received"];

export const REQUEST_TYPES = [
  { value: "refund", label: "Return for a refund" },
  { value: "exchange", label: "Exchange for another item" },
] as const;

export const REASONS = [
  { value: "changed_mind", label: "I changed my mind", photo: false },
  { value: "damaged", label: "The item arrived damaged", photo: true },
  { value: "faulty", label: "The item is faulty or does not work", photo: true },
  { value: "wrong_item", label: "I received the wrong item", photo: true },
  { value: "missing_item", label: "An item is missing from my order", photo: false },
  { value: "other", label: "Other reason", photo: false },
] as const;
export const reasonLabel = (v: string) => REASONS.find((r) => r.value === v)?.label ?? v;
export const typeLabel = (v: string) => REQUEST_TYPES.find((r) => r.value === v)?.label ?? v;

export const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };

export type ReturnItem = { order_item_id: string; product_name: string; quantity: number };
export type ReturnRow = {
  id: string; reference: string; access_token: string; order_id: string; order_reference: string;
  customer_name: string; customer_email: string; customer_phone: string | null;
  request_type: "refund" | "exchange"; reason: string; details: string | null; exchange_preference: string | null;
  items: ReturnItem[]; photo_paths: string[]; status: ReturnStatus; return_method: "collection" | "send_back" | null;
  collection_address: Record<string, string> | null; admin_message: string | null; refund_amount_zar: number | null;
  decided_at: string | null; received_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
};
