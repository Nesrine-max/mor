-- MOR's first market uses Algerian dinars.
-- Product/order writes from the frontend already use the configured currency;
-- these defaults keep direct database writes consistent as well.

alter table public.products
  alter column currency set default 'DZD';

alter table public.orders
  alter column currency set default 'DZD';
