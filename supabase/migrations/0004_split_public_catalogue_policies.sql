-- Public catalogue policies must not invoke an authenticated-only helper.
-- Admin read policies are separate so inactive records remain private.
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
  on public.categories for select
  to anon, authenticated
  using (active = true);

drop policy if exists categories_admin_read on public.categories;
create policy categories_admin_read
  on public.categories for select
  to authenticated
  using (private.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products for select
  to anon, authenticated
  using (active = true);

drop policy if exists products_admin_read on public.products;
create policy products_admin_read
  on public.products for select
  to authenticated
  using (private.is_admin());

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id and products.active = true
    )
  );

drop policy if exists product_images_admin_read on public.product_images;
create policy product_images_admin_read
  on public.product_images for select
  to authenticated
  using (private.is_admin());
