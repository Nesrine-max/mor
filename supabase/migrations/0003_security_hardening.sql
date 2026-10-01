-- Keep authorization helpers out of the public API surface while allowing RLS
-- policies to call the admin check for authenticated requests.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- These functions are used by triggers/policies, not as client-callable RPCs.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.make_order_number() set search_path = public, extensions, pg_temp;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or private.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
  on public.profiles for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
  on public.categories for select
  to anon, authenticated
  using (active = true or private.is_admin());

drop policy if exists categories_admin_insert on public.categories;
create policy categories_admin_insert
  on public.categories for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists categories_admin_update on public.categories;
create policy categories_admin_update
  on public.categories for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists categories_admin_delete on public.categories;
create policy categories_admin_delete
  on public.categories for delete
  to authenticated
  using (private.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products for select
  to anon, authenticated
  using (active = true or private.is_admin());

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert
  on public.products for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists products_admin_update on public.products;
create policy products_admin_update
  on public.products for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete
  on public.products for delete
  to authenticated
  using (private.is_admin());

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
  on public.product_images for select
  to anon, authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.products
      where products.id = product_images.product_id and products.active = true
    )
  );

drop policy if exists product_images_admin_insert on public.product_images;
create policy product_images_admin_insert
  on public.product_images for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists product_images_admin_update on public.product_images;
create policy product_images_admin_update
  on public.product_images for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists product_images_admin_delete on public.product_images;
create policy product_images_admin_delete
  on public.product_images for delete
  to authenticated
  using (private.is_admin());

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read
  on public.orders for select
  to authenticated
  using (private.is_admin());

drop policy if exists orders_admin_insert on public.orders;
create policy orders_admin_insert
  on public.orders for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update
  on public.orders for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete
  on public.orders for delete
  to authenticated
  using (private.is_admin());

drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read
  on public.order_items for select
  to authenticated
  using (private.is_admin());

drop policy if exists order_items_admin_insert on public.order_items;
create policy order_items_admin_insert
  on public.order_items for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists order_items_admin_update on public.order_items;
create policy order_items_admin_update
  on public.order_items for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists order_items_admin_delete on public.order_items;
create policy order_items_admin_delete
  on public.order_items for delete
  to authenticated
  using (private.is_admin());

drop policy if exists order_status_history_admin_read on public.order_status_history;
create policy order_status_history_admin_read
  on public.order_status_history for select
  to authenticated
  using (private.is_admin());

drop policy if exists order_status_history_admin_insert on public.order_status_history;
create policy order_status_history_admin_insert
  on public.order_status_history for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and private.is_admin()
  );

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and private.is_admin()
  )
  with check (
    bucket_id = 'product-images'
    and private.is_admin()
  );

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and private.is_admin()
  );

create index if not exists order_status_history_changed_by_idx
  on public.order_status_history(changed_by);

create index if not exists orders_created_by_idx
  on public.orders(created_by);
