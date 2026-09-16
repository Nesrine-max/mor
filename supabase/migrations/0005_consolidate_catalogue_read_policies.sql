-- Keep one SELECT policy per role/action while preserving public active reads
-- and admin access to inactive records.
drop policy if exists categories_public_read on public.categories;
drop policy if exists categories_admin_read on public.categories;
create policy categories_public_read
  on public.categories for select
  to anon
  using (active = true);

create policy categories_authenticated_read
  on public.categories for select
  to authenticated
  using (active = true or private.is_admin());

drop policy if exists products_public_read on public.products;
drop policy if exists products_admin_read on public.products;
create policy products_public_read
  on public.products for select
  to anon
  using (active = true);

create policy products_authenticated_read
  on public.products for select
  to authenticated
  using (active = true or private.is_admin());

drop policy if exists product_images_public_read on public.product_images;
drop policy if exists product_images_admin_read on public.product_images;
create policy product_images_public_read
  on public.product_images for select
  to anon
  using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id and products.active = true
    )
  );

create policy product_images_authenticated_read
  on public.product_images for select
  to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.products
      where products.id = product_images.product_id and products.active = true
    )
  );
