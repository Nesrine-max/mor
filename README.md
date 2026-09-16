# MOR

MOR is a dark, editorial-style clothing storefront for men and women with a small admin operations panel. Customers submit cash order requests through the website; staff can also record orders received through WhatsApp, phone, Instagram, walk-ins, or other offline channels.

The website never processes online payments and does not integrate a courier. Payment happens in cash in real life, while the admin panel tracks delivery progress separately.

## Current production status

- Live frontend: [mor-ashen.vercel.app](https://mor-ashen.vercel.app)
- Hosting: Vercel free tier, connected to `main`.
- Backend: hosted Supabase project with Auth, Postgres, Storage, and two Edge Functions.
- Currency: `DZD` (Algerian dinar).
- Database migrations `0001` through `0007`: applied.
- Edge Functions: `create-order` and `update-order-status`: deployed and active.
- Catalogue: the original user-created product plus 25 demo products across seven seeded categories.

The 25 seeded products come from the [DummyJSON placeholder product catalogue](https://dummyjson.com/docs/products). They are for UI and workflow testing only. Replace the demo names, images, prices, stock, and categories with MOR's real inventory before accepting real customer orders.

## Features

### Storefront

- Home page with featured products and category navigation.
- Women, men, and sportswear/unisex catalogue routes.
- Search, category filtering, sorting, loading states, and empty states.
- Product detail pages with images, sizes, stock availability, and add-to-bag behavior.
- Persistent browser bag stored under `localStorage.mor_cart`.
- Cash-only order request form for delivery or pickup.
- DZD price formatting and separate delivery/payment messaging.

### Admin

- Supabase Auth login with profile-based `admin` authorization.
- Dashboard metrics for products, categories, stock, featured products, and orders.
- Product and category create/edit/delete screens.
- Public image URL support and Supabase Storage uploads for JPG, PNG, and WebP files up to 5 MB.
- Order queue with search and status filters.
- Manual order creation for offline channels.
- Separate order, delivery, and cash status controls.
- Status history, stock reservation, stock consumption, and stock release.
- Actionable Edge Function error messages in the admin UI.

## Order model

All website and offline orders use the same database model.

| Dimension | Values |
| --- | --- |
| Source | `website`, `whatsapp`, `phone`, `instagram`, `walk_in`, `other` |
| Order status | `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled` |
| Delivery status | `not_required`, `awaiting_assignment`, `assigned`, `out_for_delivery`, `delivered`, `failed`, `returned` |
| Cash status | `cash_outstanding`, `cash_collected`, `partially_collected` |
| Inventory status | `not_reserved`, `reserved`, `consumed`, `released` |

The trusted `create_order` database function recalculates prices, validates stock and sizes, enforces one currency, and stores item snapshots. Stock is not reserved while an order is merely pending. It is reserved when an order moves to `confirmed`, `preparing`, `ready`, or `completed`; cancelling a reserved order releases it.

Cash and delivery are intentionally independent from the order status. Completing an order does not automatically mark cash collected or delivery delivered.

## Technology

- React 18 and Create React App.
- React Router 6.
- Axios for the legacy API fallback.
- `@supabase/supabase-js` for the production data layer and Auth.
- Supabase Postgres with Row Level Security.
- Supabase Storage for product images.
- Supabase Edge Functions with server-only database access.
- Plain CSS with `Cormorant Garamond` and `Jost`.
- Vercel static hosting.

## Local development

### Requirements

- Node.js and npm.
- Either the hosted Supabase configuration or a compatible legacy MOR API.
- Supabase CLI only when applying migrations, querying the hosted project, or deploying functions.

### Install and configure

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in the public Supabase values for production-mode development:

```dotenv
REACT_APP_CURRENCY=DZD
REACT_APP_LOCALE=en-US
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

When both Supabase variables are present, the app uses Supabase for catalogue reads, admin CRUD, Auth, order reads, and Edge Function writes. When they are blank, it falls back to the legacy Axios API:

```dotenv
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

The development server runs at [http://localhost:3000](http://localhost:3000).

Never put service-role keys, secret keys, passwords, or other credentials in `REACT_APP_*` variables. Create React App exposes them to the browser bundle.

## Supabase project

The repository is linked to the hosted `MOR` project (`fsstqthwpzeypxdasdjo`). The migrations are versioned in `supabase/migrations/`:

| Migration | Purpose |
| --- | --- |
| `0001_initial_schema.sql` | Profiles, categories, products, images, orders, history, RLS, and trusted order functions. |
| `0002_product_image_storage.sql` | Public-read/admin-write `product-images` bucket and upload policies. |
| `0003_security_hardening.sql` | Security-definer/search-path and authorization hardening. |
| `0004_split_public_catalogue_policies.sql` | Separates public and authenticated catalogue reads. |
| `0005_consolidate_catalogue_read_policies.sql` | Consolidates catalogue policies and indexes. |
| `0006_currency_dzd.sql` | Sets DZD as the database default currency. |
| `0007_seed_demo_inventory.sql` | Seeds 25 demo products for testing; replace before launch. |

Useful CLI commands:

```bash
npx --yes supabase login
npx --yes supabase link --project-ref <project-ref>
npx --yes supabase db push --linked
npx --yes supabase migration list --project-ref <project-ref>
npx --yes supabase db lint --linked
npx --yes supabase functions deploy create-order --no-verify-jwt
npx --yes supabase functions deploy update-order-status
```

`create-order` must remain guest-accessible for website requests. `update-order-status` must remain JWT-protected. The Edge Functions use the platform's server-side secret-key environment and never expose it to the frontend.

The custom `APP_ORIGIN` Supabase secret is set to the production frontend origin. If the frontend moves to another host, update it to the exact new origin and repeat the order/CORS smoke test.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `REACT_APP_SUPABASE_URL` | Supabase mode | Public Supabase project URL. |
| `REACT_APP_SUPABASE_PUBLISHABLE_KEY` | Supabase mode | Public publishable/anon key. |
| `REACT_APP_API_URL` | Legacy mode | Fallback API base URL, normally `http://localhost:5000/api`. |
| `REACT_APP_CURRENCY` | No | Display currency; defaults to `DZD`. |
| `REACT_APP_LOCALE` | No | Display locale; defaults to `en-US`. |

Supabase secret keys and `APP_ORIGIN` belong in the Supabase Function environment or dashboard only. Do not put them in `.env.example`, Vercel public variables, React code, or Git.

## Application routes

| Route | Area | Purpose |
| --- | --- | --- |
| `/` | Storefront | Home page, category cards, and featured products. |
| `/shop/women` | Storefront | Women’s catalogue. |
| `/shop/men` | Storefront | Men’s catalogue. |
| `/shop/unisex` | Storefront | Sportswear/unisex catalogue. |
| `/product/:id` | Storefront | Product details, size selection, and add to bag. |
| `/cart` | Storefront | Bag quantities, subtotal, and order-request link. |
| `/order` | Storefront | Cash order request with delivery or pickup details. |
| `/admin/login` | Admin | Supabase Auth login. |
| `/admin/dashboard` | Admin | Catalogue, stock, and order insights. |
| `/admin/products` | Admin | Product CRUD and image management. |
| `/admin/categories` | Admin | Category CRUD. |
| `/admin/orders` | Admin | Order queue, filters, status controls, and history. |
| `/admin/orders/new` | Admin | Manual order entry for offline sources. |

Unauthenticated visitors are redirected from protected admin routes to `/admin/login`.

## Legacy API contract

If Supabase mode is disabled, `src/api.js` expects the configured legacy API to provide:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/products` | Catalogue, admin product list, and dashboard data. |
| `GET` | `/products/:id` | Product detail. |
| `GET` | `/categories` | Catalogue filters and admin forms. |
| `POST` | `/auth/login` | Returns `{ token, email }`. |
| `POST` | `/orders` | Creates a validated cash order. |
| `GET` | `/orders` | Admin order queue. |
| `PUT` | `/orders/:id` | Updates order, delivery, or cash status. |
| `POST/PUT/DELETE` | `/products` and `/products/:id` | Product management. |
| `POST/PUT/DELETE` | `/categories` and `/categories/:id` | Category management. |

Legacy product responses should include `id`, `name`, `description`, `price`, `image_url`, `gender`, `category_name`, `stock`, `sizes`, and `featured`.

## Project structure

```text
public/
├── index.html                 HTML shell, metadata, and font imports
├── favicon.svg                MOR favicon
├── robots.txt                 Crawler rules
├── _redirects                 SPA fallback for static hosts
└── _headers                   Static-host security/cache headers

src/
├── App.js                     Providers, router, and application layout
├── api.js                     Supabase/legacy data adapter and function errors
├── config.js                  Currency, locale, and offline fulfilment labels
├── supabase.js                Public Supabase client configuration
├── components/                Navbar, footer, product card, error boundary
├── context/                   Cart and admin Auth state
├── pages/                     Storefront screens
└── styles/theme.css           Shared responsive visual system

supabase/
├── migrations/                Versioned database, RLS, storage, and seed SQL
├── functions/create-order/    Guest website/admin order creation
├── functions/update-order-status/
└── README.md                  Backend setup and launch notes
```

## Free deployment

The current deployment uses Vercel's free static hosting. Cloudflare Pages is also supported by the included `_redirects` and `_headers` files.

For Vercel:

- Build command: `npm run build`
- Output directory: `build`
- Production branch: `main`
- Public environment variables: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_PUBLISHABLE_KEY`, `REACT_APP_CURRENCY=DZD`, and `REACT_APP_LOCALE=en-US`
- No GitHub Actions workflow is required.

Free tiers can pause inactive services, enforce quotas, and provide no uptime SLA or automatic production backups. Export the database manually and monitor Supabase/Vercel usage.

## Verification

The current implementation has been verified with:

```bash
npm test -- --watchAll=false --passWithNoTests
npm run build
npx --yes supabase db lint --linked
git diff --check
```

The test command exits successfully but reports that no automated test files exist yet. Hosted verification has also covered:

- 34 end-to-end checks for Auth, catalogue reads, image storage, customer/offline orders, CORS, DZD totals, status progression, cash/delivery tracking, stock transitions, history, and access control.
- 21 targeted checks against the seeded inventory, including website order creation, admin confirmation/cancellation, stock reservation/release, and cleanup.
- 25/25 external demo thumbnails returning HTTP 200.
- Real-browser Women, Men, Sportswear, product detail, bag, cash order form, and admin-login flows with zero console errors or warnings.

## Remaining launch work

The technical demo is live, but the following still require business-owned input:

- Replace the 25 demo products with MOR's real names, descriptions, images, DZD prices, sizes, and stock.
- Provide contact/WhatsApp information and actual delivery/pickup rules.
- Upload at least one real product image through the admin panel.
- Run one real website order and one real admin-created order using the intended cash/delivery workflow.
- Rotate any legacy Supabase service key after the replacement secret-key path is verified.
- Replace footer placeholder links and home-page placeholder category imagery.

## Related documentation

- [Detailed production plan](PROJECT_PLAN.md)
- [AI progress and handoff log](AI_PROGRESS.md)
- [Supabase setup notes](supabase/README.md)

## License

No license is specified in this repository.
