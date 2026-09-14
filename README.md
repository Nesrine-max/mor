# MOR

MOR is a dark, editorial-style clothing storefront for men and women. This repository contains the React storefront/admin UI plus a local Supabase migration and order-function foundation. The deployed data layer is not connected yet, so the current screens still expect a separate HTTP API for product, category, login, and order data.

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
- Axios for API requests.
- React Context for cart state and admin authentication state.
- Plain CSS with Google Fonts (`Cormorant Garamond` and `Jost`).

## Requirements

- Node.js and npm.
- A running MOR backend API for the current Axios mode, or a configured Supabase project after the migration/data-layer work is completed.

## Getting started

1. Install the frontend dependencies:

   ```bash
   npm install
   ```

2. Configure the API URL. Create `.env.local` in the project root if the backend is not at the default address:

   ```dotenv
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_CURRENCY=USD
   REACT_APP_LOCALE=en-US
   ```

   `src/api.js` uses `REACT_APP_API_URL` when it is set and otherwise defaults to `http://localhost:5000/api`.
   `src/config.js` uses the currency and locale values for storefront and admin price formatting.

   Do not put secrets in `REACT_APP_*` variables. Create React App exposes them to the browser bundle.

3. Start the development server:

   ```bash
   npm start
   ```

   The frontend is served at [http://localhost:3000](http://localhost:3000). The backend must be reachable at the configured API base URL for products, categories, and admin login to work.

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
| `/admin/products` | Admin | Create, edit, and delete products. |
| `/admin/categories` | Admin | Create, edit, and delete categories. |
| `/admin/orders` | Admin | Filter orders and update order, delivery, and cash statuses. |
| `/admin/orders/new` | Admin | Create an order received through an offline channel. |

The admin pages are protected by `AdminLayout`. An unauthenticated visitor is redirected to `/admin/login`.

## API contract expected by the frontend

Axios requests use the configured base URL and the following relative endpoints:

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

`AdminAuthProvider` restores `mor_admin_token` and `mor_admin_email` from `localStorage`. Successful login stores both values; logout removes them. This is client-side session state and does not replace server-side authorization.

## Project structure

```text
public/
└── index.html                 HTML shell, metadata, and font imports

src/
├── index.js                   React entry point and global stylesheet import
├── App.js                     Providers, router, storefront layout, and routes
├── api.js                     Axios client, base URL, and auth interceptor
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

The first implementation slice also adds `src/config.js`, `src/pages/OrderRequest.js`, `src/pages/admin/Orders.js`, `src/pages/admin/OrderForm.js`, and the `supabase/` database/function foundation.

## Current limitations and integration notes

- The existing Axios API is still external to this repository; the Supabase schema and order function are foundations and are not connected to the React data layer yet.
- The customer and admin order screens currently expect `/orders` API endpoints. They will show a backend error until the API/Supabase integration is deployed.
- Stock reservation during confirmation/preparation and status-history writes still need to be connected to the admin status-update API.
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
