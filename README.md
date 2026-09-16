# MOR

MOR is a dark, editorial-style clothing storefront for men and women. This repository contains the React storefront/admin UI plus the hosted Supabase database, storage, and order-function foundation. The app uses Supabase when its public environment variables are configured and keeps the legacy HTTP API as a fallback.

## What is included

- Customer home page with category cards and featured products.
- Women, men, and sportswear navigation.
- Product detail pages with size selection and add-to-bag behavior.
- A browser-persisted shopping bag with quantity controls and subtotal calculation.
- Cash-only order requests from the storefront.
- Admin login, dashboard statistics, product/category CRUD, order tracking, and manual offline-order creation.
- Responsive styling with a black, burgundy, cream, and muted-gray visual system.

The order flow records requests for real-life cash fulfilment. It does not process online payments or integrate a delivery provider.

## Stack

- React 18 with Create React App and `react-scripts` 5.
- React Router 6 for client-side routing.
- Axios for legacy API requests, with a Supabase data-layer adapter for production mode.
- Supabase Auth and database/function access through `@supabase/supabase-js` when configured.
- Supabase Storage for admin-managed product images.
- React Context for cart state and admin authentication state.
- Plain CSS with Google Fonts (`Cormorant Garamond` and `Jost`).

## Requirements

- Node.js and npm.
- A running MOR backend API for legacy Axios mode, or the configured Supabase project used by the deployed application.

## Getting started

1. Install the frontend dependencies:

   ```bash
   npm install
   ```

2. Configure the data layer. Create `.env.local` in the project root:

   ```dotenv
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CURRENCY=DZD
REACT_APP_LOCALE=en-US
# Optional: use the Supabase data layer instead of the legacy API.
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_PUBLISHABLE_KEY=
```

   When both Supabase values are set, `src/api.js` uses Supabase catalog/admin queries and Edge Functions, and `AdminAuthContext` uses Supabase Auth. If they are blank, `src/api.js` falls back to `REACT_APP_API_URL` or `http://localhost:5000/api`.
   `src/config.js` uses the currency and locale values for storefront and admin price formatting.

   Do not put secrets in `REACT_APP_*` variables. Create React App exposes them to the browser bundle.

3. Start the development server:

   ```bash
   npm start
   ```

   The frontend is served at [http://localhost:3000](http://localhost:3000). A configured Supabase project or legacy backend is required for products, categories, orders, and admin login.

## Free production deployment

The repository is prepared for a static Vercel or Cloudflare Pages deployment without a GitHub Actions workflow. The current production deployment is Vercel at [mor-ashen.vercel.app](https://mor-ashen.vercel.app).

- Connect the GitHub repository from the Vercel or Cloudflare Pages dashboard, or deploy directly with the authenticated CLI.
- Build command: `npm run build`.
- Output directory: `build`.
- Production branch: `main`.
- Add `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_PUBLISHABLE_KEY`, `REACT_APP_CURRENCY`, and `REACT_APP_LOCALE` as hosting environment variables.
- Never add `SUPABASE_SERVICE_ROLE_KEY` or any secret key to Pages; the Edge Functions keep server-only secrets.
- `public/_redirects` handles SPA routes on Pages-style hosts, `public/_headers` adds static-hosting headers there, and `vercel.json` adds the equivalent Vercel headers.

The current Vercel origin is configured as the Edge Function `APP_ORIGIN` secret. If the frontend is moved to another host, set that secret to the new exact origin and repeat the public smoke test. A custom domain is optional; the free `vercel.app` or `pages.dev` address is enough for the first launch.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Run the development server. |
| `npm run build` | Create an optimized production build in `build/`. |
| `npm test -- --watchAll=false --passWithNoTests` | Run the Jest test command once. There are currently no test files. |
| `npm run eject` | Eject from Create React App. This is a one-way operation and is normally unnecessary. |

## Application routes

| Route | Area | Purpose |
| --- | --- | --- |
| `/` | Storefront | Home page, category cards, and up to eight featured products. |
| `/shop/:gender` | Storefront | Product listing entry point for women, men, or unisex/sportswear navigation. |
| `/product/:id` | Storefront | Product details, size selection, and add to bag. |
| `/cart` | Storefront | View, update, remove, or clear bag items. |
| `/order` | Storefront | Submit a cash order request with delivery or pickup details. |
| `/admin/login` | Admin | Submit email/password credentials to the backend. |
| `/admin/dashboard` | Admin | Product, category, stock, featured-item, and recent-product summary. |
| `/admin/products` | Admin | Create, edit, delete, and upload images for products. |
| `/admin/categories` | Admin | Create, edit, and delete categories. |
| `/admin/orders` | Admin | Filter orders and update order, delivery, and cash statuses. |
| `/admin/orders/new` | Admin | Create an order received through an offline channel. |

The admin pages are protected by `AdminLayout`. An unauthenticated visitor is redirected to `/admin/login`.

## Data layer and API contract

With Supabase variables configured, the frontend uses Postgres/RLS for catalogue and admin CRUD, Supabase Auth for admin login, and the `create-order`/`update-order-status` Edge Functions for trusted order writes. Without them, Axios requests use the configured base URL and the following relative endpoints:

| Method | Endpoint | Used for |
| --- | --- | --- |
| `GET` | `/products` | Shop listings, admin product lists, dashboard data. |
| `GET` | `/products?featured=1` | Home page featured products; the frontend displays the first eight results. |
| `GET` | `/products/:id` | Product detail page. |
| `POST` | `/auth/login` | Admin login with `{ email, password }`. The response must contain `token` and `email`. |
| `GET` | `/categories` | Store navigation, dashboard, and product forms. |
| `POST` | `/orders` | Create a website or admin-created cash order request. The backend must validate prices and stock. |
| `GET` | `/orders` | Admin order queue and dashboard insights. |
| `PUT` | `/orders/:id` | Admin order, delivery, or cash status update. |
| `POST` | `/products` | Create a product. |
| `PUT` | `/products/:id` | Update a product. |
| `DELETE` | `/products/:id` | Delete a product. |
| `POST` | `/categories` | Create a category with `{ name }`. |
| `PUT` | `/categories/:id` | Rename a category with `{ name }`. |
| `DELETE` | `/categories/:id` | Delete a category. |

Product responses are expected to provide the fields used by the UI, including `id`, `name`, `description`, `price`, `image_url`, `gender`, `category_name`, `stock`, `sizes`, and `featured`. The product form sends `category_id` as a number and represents `sizes` as a comma-separated string such as `S,M,L,XL`.

Category responses are expected to provide `id`, `name`, and `slug`.

If `mor_admin_token` exists in `localStorage`, `src/api.js` adds it to every Axios request as:

```http
Authorization: Bearer <token>
```

The backend remains responsible for deciding which endpoints require that token.

## State and data flow

### Cart

`CartProvider` initializes from `localStorage.mor_cart` and writes changes back to the same key. A cart line is identified by the pair `(product id, size)`, so adding the same product in another size creates a separate line. It exposes:

- `items`
- `addToCart(product, size, qty)`
- `updateQty(id, size, qty)`
- `removeFromCart(id, size)`
- `clearCart()`
- `total` and `count`

Quantities at or below zero remove a line. The cart total is an estimate for review; the backend must recalculate the final order total before saving it. The order page explains that payment is cash in real life and delivery is coordinated separately.

### Admin authentication

In Supabase mode, `AdminAuthProvider` restores the managed Supabase Auth session and checks the user's `profiles.role` before allowing access. Legacy Axios mode restores `mor_admin_token` and `mor_admin_email` from `localStorage`; that fallback still depends on server-side authorization.

## Project structure

```text
public/
└── index.html                 HTML shell, metadata, and font imports

src/
├── index.js                   React entry point and global stylesheet import
├── App.js                     Providers, router, storefront layout, and routes
├── api.js                     Conditional Supabase/legacy data adapter
├── supabase.js                Supabase client and environment detection
├── components/
│   ├── Footer.js              Store footer and navigation links
│   ├── Navbar.js              Store navigation, category menus, and bag count
│   └── ProductCard.js         Reusable product preview link
├── context/
│   ├── AdminAuthContext.js    Admin login/session state
│   └── CartContext.js         Persistent bag state and totals
├── pages/
│   ├── Home.js                Hero, categories, and featured products
│   ├── Shop.js                Product listing page
│   ├── ProductDetail.js       Product information and size selection
│   ├── Cart.js                Bag display and quantity actions
│   └── admin/
│       ├── AdminLayout.js     Protected admin shell and navigation
│       ├── Login.js           Admin login form
│       ├── Dashboard.js       Admin metrics and recent products
│       ├── Products.js        Product management form and table
│       └── Categories.js      Category management form and table
└── styles/
    └── theme.css              Shared theme, layout, component, and responsive CSS
```

The implementation also adds `src/config.js`, `src/pages/OrderRequest.js`, `src/pages/admin/Orders.js`, `src/pages/admin/OrderForm.js`, and the `supabase/` database/function foundation.

## Current limitations and integration notes

- The hosted `MOR` Supabase project is connected. Migrations `0001`–`0007` are applied, and both order functions are deployed.
- Migrations `0003`–`0005` harden authorization helpers and keep public catalogue reads separate from admin-only reads.
- The hosted catalogue contains the original user-created item plus 25 demo products from the documented [DummyJSON placeholder catalogue](https://dummyjson.com/docs/products). The demo records use DZD prices, stock, and public thumbnail URLs for testing; replace them with MOR's real catalogue before accepting real orders. Supabase-mode product management supports public image URLs and validated uploads to the `product-images` bucket.
- The customer and admin order screens require the deployed `create-order` and `update-order-status` functions when Supabase mode is enabled.
- The hosted migration includes transactional stock reservation/release and status-history writes; a full real-data order test still remains.
- Footer links for shipping, returns, size guide, about, and contact currently point to `#!` placeholders.
- Several data loads intentionally have minimal error handling; the backend should return predictable errors and status codes.
- There is no automated test suite in the repository yet.

## Verification

The current source compiles successfully with:

```bash
npm run build
```

The test runner also exits successfully when invoked with `--passWithNoTests`, but it reports that no tests are present.

## License

No license is specified in the repository.
