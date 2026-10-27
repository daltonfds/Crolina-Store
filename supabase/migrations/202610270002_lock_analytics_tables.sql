-- Only trusted server routes may access analytics and contact data.
revoke all on table public.store_visitor_events from anon, authenticated;
revoke all on table public.store_marketing_contacts from anon, authenticated;
grant all on table public.store_visitor_events to service_role;
grant all on table public.store_marketing_contacts to service_role;
