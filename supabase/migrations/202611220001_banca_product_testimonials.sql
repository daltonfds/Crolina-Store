-- Store customer testimonial screenshots separately from product photos.
alter table public.banca_products
  add column if not exists testimonials jsonb not null default '[]'::jsonb;
