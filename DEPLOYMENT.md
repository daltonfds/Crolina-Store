# Production deployment checklist — Crolina Store

## Important repository/project note
Use the repository that actually contains this code. The linked GitHub integration currently exposes `daltonfds/Crolina-Store`; it did not find a repository named `daltonfds/Crolina-shop`. Confirm the intended repository before connecting production.

## Local verification
```bash
git clone https://github.com/daltonfds/Crolina-Store.git
cd Crolina-Store
npm install
cp .env.example .env.local
npm run typecheck
npm run build
```
Fill `.env.local` locally before testing checkout. Never commit it.

## Vercel CLI
Run from the project directory and use the Vercel team that owns the domain/project:
```bash
npx vercel login
npx vercel project add crolina-shop --scope <YOUR_VERCEL_TEAM_SLUG_OR_ID>
npx vercel link --project crolina-shop --scope <YOUR_VERCEL_TEAM_SLUG_OR_ID>
```
If project creation is denied, the team owner must grant project-creation permission or import the repository through the Vercel dashboard. Do not reuse a different Vite project for this Next.js app.

Add each value when prompted. Use production only for live credentials:
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add RESEND_API_KEY production
npx vercel env add RESEND_FROM_EMAIL production
npx vercel env add STORE_ALERT_EMAIL production
npx vercel env add NEXT_PUBLIC_STORE_URL production
npx vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production
```
Set values to:
- `NEXT_PUBLIC_SUPABASE_URL=https://dbyzwgbdoiepfrgzfcsz.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable key (safe for browser)
- `SUPABASE_SERVICE_ROLE_KEY`: secret/service-role key from Supabase project API settings; server-only, never prefix it with NEXT_PUBLIC
- `RESEND_API_KEY`: private Resend API key
- `RESEND_FROM_EMAIL=Crolina Store <support@crolina.shop>` only after Resend verifies the sender/domain
- `STORE_ALERT_EMAIL=support@crolina.shop`
- `NEXT_PUBLIC_STORE_URL=https://www.crolina.shop`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: verified WhatsApp number in international digits, e.g. 27XXXXXXXXX

Deploy:
```bash
npx vercel deploy --prod --scope <YOUR_VERCEL_TEAM_SLUG_OR_ID>
```
In Vercel Project Settings → Domains, add `www.crolina.shop` and optionally `crolina.shop` with a redirect to `www.crolina.shop`. Copy the exact DNS records Vercel displays into your domain registrar; do not guess records.

## Admin account
Create/invite `daltonfelizarda66@gmail.com` in Supabase Authentication using the secure password setup/reset flow, then run `supabase/admin-bootstrap.sql` in the Supabase SQL Editor. Do not hardcode a password in source control. Since a password was shared in chat, rotate it before first production use.

## Go-live checklist
- Verify actual supplier SKU, specs, condition, stock, product photos and final pricing.
- Enter verified bank/EFT/M-Pesa/e-Mola instructions and external payment link in `/admin/dashboard`.
- Set real delivery pricing; current RPC intentionally charges R0 and the UI says delivery will be confirmed.
- Verify `support@crolina.shop` sender domain and Resend delivery.
- Test checkout, stock concurrency, proof upload, admin-only access, status changes, cancellation stock restoration, mobile layout and email delivery.
- Review POPIA privacy wording and South African consumer-law policies with a qualified adviser before launch.
