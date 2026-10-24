-- Remove the demo catalogue seeded by the initial Crolina Shop migration.
-- The live products table is intentionally kept empty for manual owner-managed product entry.
delete from public.products
where slug in (
  'kindle-11th-gen-16gb-black',
  'kindle-paperwhite-11th-gen-8gb-used-like-new',
  'smartwatch-amoled-bluetooth-calling',
  'fitness-smartwatch-used',
  '20000mah-usbc-power-bank-225w',
  '10000mah-slim-power-bank-used-like-new',
  'tws-wireless-earbuds-charging-case',
  'tws-earbuds-used-like-new',
  'mini-ups-router-8800mah',
  'mini-dc-ups-12v-used'
);
