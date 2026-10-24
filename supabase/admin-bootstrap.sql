-- Run only after creating/inviting daltonfelizarda66@gmail.com in Supabase Dashboard > Authentication > Users.
-- Never commit a password or create an auth user with plaintext credentials in SQL.
insert into public.admin_users(user_id,email)
select id, lower(email) from auth.users where lower(email)='daltonfelizarda66@gmail.com'
on conflict (user_id) do update set email=excluded.email;
-- Verify exactly one row is returned:
select user_id,email,created_at from public.admin_users where lower(email)='daltonfelizarda66@gmail.com';
