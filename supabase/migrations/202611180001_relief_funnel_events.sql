-- Allow the /relief chat funnel to be tracked in the visitor journey timeline.
alter table public.store_visitor_events
  drop constraint if exists store_visitor_events_event_type_check;

alter table public.store_visitor_events
  add constraint store_visitor_events_event_type_check
  check (event_type in (
    'page_view',
    'product_view',
    'add_to_cart',
    'checkout_started',
    'checkout_completed',
    'order_placed',
    'cookie_accepted',
    'exit_prompt_opened',
    'relief_started',
    'relief_plan_shown',
    'relief_upsell',
    'relief_whatsapp_click'
  ));
