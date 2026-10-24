# Crolina Store
Next.js App Router, TypeScript, Tailwind CSS, Supabase and Resend storefront for South African customers. Currency is ZAR.

## Local development
1. Install Node.js 20+.
2. Copy .env.example to .env.local and fill in all values.
3. Run npm install, then npm run dev.
4. Never expose SUPABASE_SERVICE_ROLE_KEY in any NEXT_PUBLIC variable or commit a real .env file.

## Supabase
Project ref: dbyzwgbdoiepfrgzfcsz; region: sa-east-1. The catalogue seed and server-only atomic order RPC are in supabase/migrations and have been applied to the hosted project. Seed listings use indicative sample pricing and supplier specs; verify exact SKUs, supplier cost, product condition, warranty and availability before accepting payment. Stock is reserved when an order is created; restore inventory manually if an order is cancelled/refunded until a controlled stock-restoration operation is added.

## Administrator setup
1. In Supabase Dashboard > Authentication > Users, invite/create daltonfelizarda66@gmail.com and set the password using Supabase's secure password setup/reset flow. Do not put a password in source code.
2. Run supabase/admin-bootstrap.sql in the Supabase SQL Editor after the user exists.
3. Add server-only SUPABASE_SERVICE_ROLE_KEY in Vercel Production (and other environments only as needed). Never expose it to the browser.
4. Sign in at /admin/login. Admin APIs verify the Supabase access token and admin_users membership on every request.

## Required environment variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable/legacy anon key)
- SUPABASE_SERVICE_ROLE_KEY (server only; required for order RPC, private proof upload and admin APIs)
- RESEND_API_KEY
- RESEND_FROM_EMAIL (verified sender, e.g. Crolina Store <support@crolina.shop>)
- STORE_ALERT_EMAIL (notification inbox; use support@crolina.shop after mailbox/domain setup)
- NEXT_PUBLIC_STORE_URL
- NEXT_PUBLIC_WHATSAPP_NUMBER (digits only, e.g. 27...)

## Payment and production safety
- Configure verified bank details and a verified external payment URL at /admin/dashboard > Payment settings. No bank details are fabricated or seeded.
- Proofs are stored in a private bucket; short-lived signed URLs are only returned to authenticated administrators.
- Payment proof is not proof of cleared funds. Verify funds with the bank/payment provider before setting an order to Paid.
- Delivery currently uses R0 in the order calculation and is displayed as to-be-confirmed. Configure real delivery fees/rules before launch.
- Resend requires domain verification and an authorised sender address.
- Run npm install, npm run typecheck and npm run build after pulling. Test guest checkout, stock contention, proof upload, admin role enforcement, email delivery and inventory reconciliation before production.
