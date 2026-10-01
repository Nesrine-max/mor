-- Seed a varied demo catalogue for storefront and order-flow testing.
-- Source: https://dummyjson.com/docs/products (placeholder data, not real stock).
-- Sample USD prices are converted at 150 DZD/USD and rounded to the nearest 100 DZD.
-- Replace these records with MOR's real catalogue before taking customer orders.

insert into public.categories (name, slug, sort_order, active)
values
  ('Tops', 'tops', 10, true),
  ('Men''s Shirts', 'mens-shirts', 20, true),
  ('Women''s Dresses', 'womens-dresses', 30, true),
  ('Men''s Shoes', 'mens-shoes', 40, true),
  ('Women''s Shoes', 'womens-shoes', 50, true),
  ('Women''s Bags', 'womens-bags', 60, true),
  ('Sunglasses', 'sunglasses', 70, true)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    active = true;

insert into public.products (
  name,
  slug,
  description,
  price_minor,
  currency,
  gender,
  category_id,
  stock_quantity,
  sizes,
  featured,
  active,
  image_url
)
select
  seed.name,
  seed.slug,
  seed.description,
  seed.price_minor,
  'DZD',
  seed.gender,
  categories.id,
  seed.stock_quantity,
  seed.sizes,
  seed.featured,
  true,
  seed.image_url
from (
  values
    ('Blue Frock', 'demo-blue-frock', 'A breezy blue frock with an easy silhouette for warm days.', 450000, 'women', 'tops', 52, ARRAY['S', 'M', 'L', 'XL']::text[], true, 'https://cdn.dummyjson.com/product-images/tops/blue-frock/thumbnail.webp'),
    ('Girl Summer Dress', 'demo-girl-summer-dress', 'A light summer dress for relaxed daytime looks.', 300000, 'women', 'tops', 43, ARRAY['S', 'M', 'L']::text[], false, 'https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/thumbnail.webp'),
    ('Gray Dress', 'demo-gray-dress', 'A versatile gray dress with a clean everyday shape.', 520000, 'women', 'tops', 55, ARRAY['S', 'M', 'L', 'XL']::text[], false, 'https://cdn.dummyjson.com/product-images/tops/gray-dress/thumbnail.webp'),
    ('Short Frock', 'demo-short-frock', 'A short frock designed for casual, easy movement.', 370000, 'women', 'tops', 22, ARRAY['S', 'M', 'L']::text[], false, 'https://cdn.dummyjson.com/product-images/tops/short-frock/thumbnail.webp'),

    ('Blue & Black Check Shirt', 'demo-blue-black-check-shirt', 'A classic check shirt with a comfortable everyday fit.', 450000, 'men', 'mens-shirts', 38, ARRAY['S', 'M', 'L', 'XL']::text[], true, 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/thumbnail.webp'),
    ('Man Plaid Shirt', 'demo-man-plaid-shirt', 'A timeless plaid shirt for casual and smart-casual styling.', 520000, 'men', 'mens-shirts', 82, ARRAY['S', 'M', 'L', 'XL']::text[], false, 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/thumbnail.webp'),
    ('Man Short Sleeve Shirt', 'demo-man-short-sleeve-shirt', 'A lightweight short-sleeve shirt for warm days.', 300000, 'men', 'mens-shirts', 2, ARRAY['S', 'M', 'L', 'XL']::text[], false, 'https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/thumbnail.webp'),
    ('Men Check Shirt', 'demo-men-check-shirt', 'A polished check shirt that works from weekday to weekend.', 420000, 'men', 'mens-shirts', 95, ARRAY['S', 'M', 'L', 'XL']::text[], false, 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/thumbnail.webp'),

    ('Black Women''s Gown', 'demo-black-womens-gown', 'A statement black gown for evening occasions.', 1950000, 'women', 'womens-dresses', 25, ARRAY['S', 'M', 'L', 'XL']::text[], true, 'https://cdn.dummyjson.com/product-images/womens-dresses/black-women''s-gown/thumbnail.webp'),
    ('Corset Leather With Skirt', 'demo-corset-leather-with-skirt', 'A coordinated corset-and-skirt look with an expressive edge.', 1350000, 'women', 'womens-dresses', 30, ARRAY['S', 'M', 'L']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/thumbnail.webp'),
    ('Corset With Black Skirt', 'demo-corset-with-black-skirt', 'A sleek corset-and-skirt pairing for a styled occasion look.', 1200000, 'women', 'womens-dresses', 33, ARRAY['S', 'M', 'L']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/thumbnail.webp'),
    ('Dress Pea', 'demo-dress-pea', 'A playful patterned dress for casual outings.', 750000, 'women', 'womens-dresses', 6, ARRAY['S', 'M', 'L']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/thumbnail.webp'),

    ('Red & Black High-Top Sneaker', 'demo-red-black-high-top-sneaker', 'A bold high-top sneaker with an athletic everyday profile.', 2250000, 'men', 'mens-shoes', 7, ARRAY['40', '41', '42', '43', '44']::text[], true, 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/thumbnail.webp'),
    ('Performance Baseball Cleat', 'demo-performance-baseball-cleat', 'A supportive cleat designed for traction and active movement.', 1200000, 'men', 'mens-shoes', 12, ARRAY['40', '41', '42', '43', '44']::text[], false, 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/thumbnail.webp'),
    ('Retro Rider Trainer', 'demo-retro-rider-trainer', 'A retro-inspired trainer that balances comfort and daily style.', 1350000, 'men', 'mens-shoes', 90, ARRAY['40', '41', '42', '43', '44']::text[], false, 'https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/thumbnail.webp'),
    ('Off-White & Red Sport Sneaker', 'demo-off-white-red-sport-sneaker', 'A sporty off-white and red sneaker for energetic everyday looks.', 1800000, 'men', 'mens-shoes', 17, ARRAY['40', '41', '42', '43', '44']::text[], false, 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/thumbnail.webp'),

    ('Black & Brown Slipper', 'demo-black-brown-slipper', 'A comfortable slipper with a simple, relaxed profile.', 300000, 'women', 'womens-shoes', 3, ARRAY['36', '37', '38', '39', '40']::text[], true, 'https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/thumbnail.webp'),
    ('Golden Occasion Shoe', 'demo-golden-occasion-shoe', 'A golden shoe that adds a polished finish to special-occasion looks.', 750000, 'women', 'womens-shoes', 88, ARRAY['36', '37', '38', '39', '40']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/thumbnail.webp'),
    ('Pampi Everyday Shoe', 'demo-pampi-everyday-shoe', 'A versatile everyday shoe with a comfortable casual shape.', 450000, 'women', 'womens-shoes', 49, ARRAY['36', '37', '38', '39', '40']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-shoes/pampi-shoes/thumbnail.webp'),
    ('Red Statement Shoe', 'demo-red-statement-shoe', 'A bright red shoe for adding colour to casual or occasion looks.', 520000, 'women', 'womens-shoes', 7, ARRAY['36', '37', '38', '39', '40']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/thumbnail.webp'),

    ('Blue Women''s Handbag', 'demo-blue-womens-handbag', 'A structured blue handbag for everyday essentials.', 750000, 'women', 'womens-bags', 76, ARRAY['One Size']::text[], true, 'https://cdn.dummyjson.com/product-images/womens-bags/blue-women''s-handbag/thumbnail.webp'),
    ('Women''s Leather Shoulder Bag', 'demo-womens-leather-shoulder-bag', 'A polished leather shoulder bag for daily carry.', 1950000, 'women', 'womens-bags', 99, ARRAY['One Size']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-bags/heshe-women''s-leather-bag/thumbnail.webp'),
    ('White Faux Leather Backpack', 'demo-white-faux-leather-backpack', 'A clean white backpack with room for everyday essentials.', 600000, 'unisex', 'womens-bags', 39, ARRAY['One Size']::text[], false, 'https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/thumbnail.webp'),

    ('Black Sun Glasses', 'demo-black-sun-glasses', 'A classic black frame for easy everyday styling.', 450000, 'unisex', 'sunglasses', 60, ARRAY['One Size']::text[], true, 'https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/thumbnail.webp'),
    ('Green & Black Glasses', 'demo-green-black-glasses', 'A distinctive green and black frame for a statement finish.', 520000, 'unisex', 'sunglasses', 24, ARRAY['One Size']::text[], false, 'https://cdn.dummyjson.com/product-images/sunglasses/green-and-black-glasses/thumbnail.webp')
) as seed(name, slug, description, price_minor, gender, category_slug, stock_quantity, sizes, featured, image_url)
join public.categories on public.categories.slug = seed.category_slug
on conflict (slug) do nothing;
