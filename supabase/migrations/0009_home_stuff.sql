alter table public.categories drop constraint if exists categories_gender_check;
alter table public.products drop constraint if exists products_gender_check;
update public.categories set gender = 'home' where gender = 'unisex';
update public.products set gender = 'home' where gender = 'unisex';
alter table public.categories add check (gender in ('men', 'women', 'home'));
alter table public.products add check (gender in ('men', 'women', 'home'));
