-- Per-product payment link, proof of terms acceptance, and document proofs.
alter table public.products add column if not exists checkout_url text
  check (checkout_url is null or checkout_url ~* '^https://');
alter table public.orders add column if not exists terms_accepted_at timestamptz;

-- Allow documents (not only photos) as proof of payment.
update storage.buckets set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'
] where id = 'payment-proofs';
