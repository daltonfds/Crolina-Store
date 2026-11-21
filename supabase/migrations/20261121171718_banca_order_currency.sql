ALTER TABLE public.banca_orders
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'MZN';

ALTER TABLE public.banca_orders
  DROP CONSTRAINT IF EXISTS banca_orders_currency_check;

ALTER TABLE public.banca_orders
  ADD CONSTRAINT banca_orders_currency_check
  CHECK (currency IN ('BRL', 'ZAR', 'MZN'));
