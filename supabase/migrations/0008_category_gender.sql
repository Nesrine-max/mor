alter table public.categories add column gender text not null default 'women';
alter table public.categories drop constraint categories_name_key;
alter table public.categories add unique (gender, name);
update public.categories set gender = 'men' where slug in ('mens-shirts', 'mens-shoes');
update public.categories set gender = 'women' where slug not in ('mens-shirts', 'mens-shoes');
