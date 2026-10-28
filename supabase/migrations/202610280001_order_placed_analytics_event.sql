-- Allow the journey timeline to distinguish an order being placed from a payment being confirmed.
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
    'exit_prompt_opened'
  ));
