# MOR production website plan

## 1. Product definition

Implementation status: Phase 0 is partially implemented and the initial Phase 1 database/order foundation has been added. The React order screens are present, but no Supabase project is connected and the app is not production-ready yet.

MOR should become a customer-facing clothing catalogue and an offline order-operations system.

Customers can browse products and submit order requests from the website. Administrators can also create orders received through WhatsApp, phone calls, Instagram, walk-ins, or any other offline channel. All orders enter the same system.

Payment is always handled in real life with cash. The website must never process a card, bank, wallet, or other online payment. Delivery is also handled outside the website; the admin panel only records delivery progress so the team knows what must be prepared, handed over, or followed up.

The initial target is a small, production-usable pilot hosted at zero monthly hosting cost. Free tiers have quotas, may pause, and do not provide a production SLA, so this is a validation launch rather than a guarantee of permanent enterprise availability.

## 2. Decisions already made

- Support both customer-created orders and admin-created orders.
- Keep cash/payment processing offline.
- Track delivery separately from order and cash status.
- Do not integrate a courier or delivery provider in the first release.
- Do not add online payment gateways.
- Prefer free hosting and free maintenance tools.
- Preserve the existing dark, editorial MOR design direction while improving usability and polish.
- Keep the current React application for the first production version; do not start with a framework rewrite.

## 3. Recommended architecture

```text
Customer browser / admin browser
              |
      React app on Cloudflare Pages
              |
   Supabase Auth + Postgres + Storage
              |
 Supabase Edge Functions for trusted order writes
```

### Frontend hosting

Deploy the existing Create React App frontend to Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `build`
- Production branch: `main`
- Initial public address: a free `pages.dev` subdomain
- Environment variables configured in the hosting dashboard
- Preview deployment for pull requests

Cloudflare Pages is suitable for the static React client and provides automatic Git deployments. The free plan currently lists limits such as 500 builds per month, 20,000 files per site, and a 25 MiB maximum individual asset size. See the [Cloudflare Pages React guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) and [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

### Backend, database, authentication, and images

Use one Supabase project for:

- PostgreSQL data
- Admin authentication
- Row Level Security
- Product image storage
- Small server-side Edge Functions

The browser may use a publishable Supabase key. Secret/service keys must remain inside Edge Functions or the Supabase dashboard and must never be placed in the React bundle.

Supabase Free currently includes a small database, file storage, authentication, and Edge Functions, but free projects can pause after inactivity and do not include automatic backups or an uptime SLA. The limits must be checked before launch and monitored after launch. See [Supabase pricing](https://supabase.com/pricing), [Auth](https://supabase.com/docs/guides/auth), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), and [API key security](https://supabase.com/docs/guides/getting-started/api-keys).

### Automation and analytics

- Use GitHub for versioned commits and pushes; add automated CI later only if the project needs it.
- Keep deployment connected to Cloudflare Pages so only verified changes reach production.
- Add Cloudflare Web Analytics after launch for privacy-friendly traffic and performance data. See [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/).
- Use manual database exports until there is revenue for a paid backup plan. Never store customer exports in a public repository.

## 4. Current repository assessment

The repository is currently a frontend-only Create React App project:

- React 18, React Router 6, Axios, and `react-scripts` 5.
- Storefront routes exist for home, shop, product details, and cart.
- Admin routes exist for login, dashboard, products, categories, order tracking, and manual order creation.
- Cart state is persisted in `localStorage` under `mor_cart`.
- Admin token/email state is persisted in `localStorage` under `mor_admin_token` and `mor_admin_email`.
- Axios expects an external API at `REACT_APP_API_URL` or `http://localhost:5000/api`.
- No deployed backend or connected database exists yet. A local Supabase migration and order Edge Function foundation now exists, but it has not been applied to a project.
- `Home.js` uses placeholder Picsum category images.
- `Cart.js` now links to a cash-only order-request form; no online checkout or payment handling is present.
- Prices use configurable currency/locale settings, and delivery is displayed as coordinated separately.
- The initial implementation fixed the `Shop.js` route/query mismatch; the future backend must now support the `gender` and `category` request parameters.
- Footer help/company links are placeholders.
- `.env` and `node_modules` were removed from the Git index and are now ignored locally; the staged index cleanup must be included in the eventual commit/review.

## 5. User experiences

### 5.1 Customer order flow

1. Customer opens the catalogue.
2. Customer filters by gender/category and opens a product.
3. Customer selects a size and adds the product to the bag.
4. Customer opens the bag and reviews quantities.
5. Customer selects `Place order request`.
6. Customer enters name, phone/WhatsApp, delivery or pickup choice, address when needed, and notes.
7. The server re-checks product availability and current prices.
8. The order is created with source `website` and status `pending`.
9. The customer sees an order number and a clear message that payment is cash in real life and delivery will be confirmed separately.
10. An administrator confirms the request by phone or WhatsApp.

There is no customer account requirement in the first release. Guest order submission keeps the flow short and avoids unnecessary authentication work.

### 5.2 Admin order flow

1. Admin signs in.
2. Admin sees new web orders and orders entered manually.
3. Admin can create an order from any offline source using `+ New order`.
4. Admin selects products, sizes, quantities, customer information, delivery mode, and notes.
5. Admin confirms the order after contacting the customer.
6. Admin moves the order through preparation and delivery statuses.
7. Admin records cash collection separately.
8. Admin can search, filter, edit, cancel, and review the complete status history.

Manual orders should support sources such as `whatsapp`, `phone`, `instagram`, `walk_in`, and `other` in addition to `website`.

## 6. Order status model

Do not use one overloaded status field. Keep the following dimensions separate.

### Order status

Recommended values:

- `pending`: request received but not verified
- `confirmed`: customer and items confirmed
- `preparing`: staff is assembling the order
- `ready`: ready for pickup or handover
- `completed`: customer received the order
- `cancelled`: order will not be fulfilled

### Delivery status

Recommended values:

- `not_required`: customer pickup or no delivery
- `awaiting_assignment`
- `assigned`
- `out_for_delivery`
- `delivered`
- `failed`
- `returned`

### Cash status

Recommended values:

- `cash_outstanding`
- `cash_collected`
- `partially_collected`

The first version should not add refund logic unless the real-life process requires it.

### Stock behavior

Reserve stock when an order becomes `confirmed` or `preparing`, not when an unverified web request is created. Release the reservation if the order is cancelled before fulfillment. This prevents abandoned requests from blocking products while still reducing overselling.

The final stock rule must be enforced in a database transaction or trusted Edge Function, not only in React.

## 7. Database design

Use migrations checked into the repository under `supabase/migrations/`. Prices should be stored as integer minor units rather than floating-point values. Keep one configured currency for the first market.

### `profiles`

- `id` references `auth.users.id`
- `display_name`
- `role` (`admin` for the first release)
- `created_at`

### `categories`

- `id`
- `name`
- `slug`
- `sort_order`
- `active`
- `created_at`
- `updated_at`

### `products`

- `id`
- `name`
- `slug`
- `description`
- `price_minor`
- `currency`
- `gender` (`men`, `women`, `unisex`)
- `category_id`
- `stock_quantity`
- `sizes`
- `featured`
- `active`
- `image_url` or primary image reference
- `created_at`
- `updated_at`

### `product_images`

- `id`
- `product_id`
- `storage_path`
- `alt_text`
- `sort_order`
- `created_at`

This allows the product UI to grow from one image to a gallery without changing the product record.

### `orders`

- `id`
- `order_number`
- `source`
- `customer_name`
- `customer_phone`
- `customer_email` nullable
- `delivery_type` (`pickup`, `delivery`)
- `delivery_address` nullable
- `delivery_notes` nullable
- `order_status`
- `delivery_status`
- `cash_status`
- `subtotal_minor`
- `delivery_fee_minor`
- `total_minor`
- `currency`
- `admin_notes`
- `created_by` nullable for web orders, set for admin-created orders
- `confirmed_at`
- `completed_at`
- `cancelled_at`
- `created_at`
- `updated_at`

### `order_items`

- `id`
- `order_id`
- `product_id` nullable for historical safety
- `product_name_snapshot`
- `size`
- `quantity`
- `unit_price_minor`
- `line_total_minor`

Historical snapshots ensure that changing a product name or price does not rewrite an old order.

### `order_status_history`

- `id`
- `order_id`
- `changed_by` nullable for automated/customer-created events
- `field_name`
- `old_value`
- `new_value`
- `note`
- `created_at`

This gives the admin a trustworthy timeline of who changed an order and when.

## 8. Backend behavior

### Public operations

- Read active categories.
- Read active products.
- Submit a new order request through a trusted function.

### Admin operations

- Sign in and sign out.
- Read and manage categories.
- Read, create, edit, archive, and delete products.
- Upload and remove product images.
- Create orders from offline channels.
- Update order, delivery, and cash statuses.
- Read dashboard aggregates.
- Export orders as CSV from the admin browser.

### Trusted order creation

Create one `create-order` Edge Function for both customer and admin order creation. It must:

1. Validate the request shape.
2. Reject invalid product IDs, sizes, or quantities.
3. Read current product prices from the database.
4. Check stock.
5. Calculate totals server-side.
6. Insert the order and item snapshots atomically.
7. Write the first status-history event.
8. Return the order number.

For a customer request, the function accepts an unauthenticated request but only permits safe order fields. For an admin request, it validates the authenticated admin role and allows internal notes and offline source fields.

### Trusted status changes

Admin status updates should be protected by RLS or a database function. Every transition should append to `order_status_history`. Invalid transitions, such as marking a cancelled order as out for delivery, should be rejected or require an explicit restore action.

## 9. Admin dashboard requirements

### Dashboard overview

Show date-filterable cards for:

- New orders
- Orders awaiting confirmation
- Orders being prepared
- Orders ready for delivery or pickup
- Orders out for delivery
- Completed orders
- Cash outstanding
- Cash collected
- Recorded order value

Show operational queues below the cards:

- Orders needing confirmation
- Orders to prepare today
- Orders awaiting delivery assignment
- Failed deliveries needing follow-up
- Low-stock products

### Orders page

The order table needs:

- Search by order number, customer name, or phone.
- Filters for each status dimension.
- Source filter.
- Date range filter.
- Sort by newest, oldest, total, and status.
- Clear badges for order, delivery, and cash states.
- Quick actions for common transitions.

The order detail view needs:

- Customer contact information.
- Product lines, sizes, quantities, and totals.
- Delivery details.
- Admin notes.
- Status controls.
- Status history.
- Cash collection action.
- Print-friendly or copyable delivery summary.

### Products and categories

Improve the existing management screens with:

- Image upload and preview.
- Active/inactive toggle.
- Search and filtering.
- Stock quantity editing.
- Size validation.
- Currency-aware price input.
- Featured and sort-order controls.
- Form-level error messages.
- Confirmation before destructive actions.

## 10. Storefront and UI work

Keep the existing MOR dark/burgundy direction but make it production-ready.

### Navigation and layout

- Add a real mobile menu instead of hiding navigation below 900px.
- Make category navigation work on touch devices, not only hover.
- Add a visible contact/location link.
- Add a 404 page.
- Add error boundaries and API error screens.
- Make the admin layout usable on smaller screens.

### Catalog

- Fix `/shop/:gender` to read the `gender` parameter.
- Read `category` from the query string.
- Add search, sort, and filters.
- Use consistent product cards on all listing pages.
- Add product availability and disabled unavailable sizes.
- Add skeleton states while data loads.
- Add a clear empty state when no products match.

### Product detail

- Add an image gallery.
- Make size selectors real keyboard-accessible buttons.
- Show available stock or an out-of-stock state.
- Add clear price/currency formatting.
- Add a shareable product URL.
- Add a clear `Add to bag` confirmation.

### Bag and order form

- Keep local bag persistence.
- Validate quantities against current stock before submission.
- Replace the checkout alert with an order-request form.
- State clearly that payment is cash and delivery is handled separately.
- Show a final review before submitting.
- Show the generated order number after submission.

### Accessibility and performance

- Use semantic buttons, headings, forms, and navigation.
- Add labels and keyboard focus states.
- Check color contrast.
- Support keyboard navigation through menus and dialogs.
- Add meaningful alt text.
- Lazy-load below-the-fold images.
- Resize/compress images before storage.
- Add explicit image dimensions to reduce layout shifts.
- Test mobile widths and slow connections.

### Content and SEO

- Replace placeholder images and copy.
- Add favicon and Open Graph metadata.
- Add `robots.txt` and sitemap.
- Add product metadata and structured data where appropriate.
- Add Contact, Location, Shipping/Delivery, Returns, and About pages.
- State the real-life cash and delivery process clearly.
- Confirm privacy and customer-data requirements for the operating country before launch.

## 11. Repository and security hygiene

Complete this before connecting deployment:

- Add `.gitignore` for `node_modules/`, `build/`, `.env`, `.env.*`, and local tooling files.
- Add `.env.example` containing variable names only.
- Stop tracking `node_modules` without deleting the local install.
- Stop tracking `.env` after checking that it contains no secrets.
- Rotate any credential that was ever committed.
- Keep only public/publishable client keys in frontend environment variables.
- Never place Supabase secret/service-role keys in React code.
- Enable RLS on every exposed table.
- Restrict product writes and all order administration to the admin role.
- Validate and sanitize customer input.
- Add basic spam protection to the public order form.
- Avoid logging full customer addresses or unnecessary personal data.

## 12. Implementation phases

### Phase 0: repository cleanup and decisions

- [ ] Confirm operating country, currency, phone format, delivery modes, and store contact details.
- [ ] Add `.gitignore` and `.env.example`.
- [ ] Remove tracked `node_modules` and `.env` from version control safely.
- [ ] Check history for secrets.
- [ ] Decide the initial stock-reservation rule.
- [ ] Decide which order sources the admin must support at launch.
- [ ] Fix the shop route/query mismatch.
- [ ] Replace dollar/free-shipping assumptions with configuration.

**Exit condition:** the repository is safe to connect to public hosting and the product/order rules are written down.

### Phase 1: Supabase foundation

- [ ] Create the Supabase project.
- [ ] Initialize the Supabase folder and migrations.
- [ ] Create tables, indexes, constraints, and status checks.
- [ ] Seed categories and sample products.
- [ ] Configure the admin Auth user.
- [ ] Create the admin role/profile policy.
- [ ] Enable and test RLS.
- [ ] Create the product image bucket and policies.
- [ ] Create the trusted order function.
- [ ] Add local development environment documentation.

**Exit condition:** catalog reads work, admin writes are protected, and a test order can be created with correct totals and item snapshots.

### Phase 2: frontend data-layer migration

- [ ] Add the Supabase client module.
- [ ] Replace custom admin login/token handling with Supabase Auth.
- [ ] Update `AdminAuthContext` to restore and observe the Supabase session.
- [ ] Replace or refactor `api.js` around the chosen Supabase data access layer.
- [ ] Keep cart persistence but add current-stock validation.
- [ ] Add shared currency, date, and status formatting utilities.
- [ ] Add shared loading/error helpers.

**Exit condition:** the frontend reads real Supabase data and protected admin screens reject unauthenticated users.

### Phase 3: storefront completion

- [ ] Fix gender/category navigation.
- [ ] Implement search, sorting, filters, and empty states.
- [ ] Upgrade product cards and product detail pages.
- [ ] Add mobile navigation.
- [ ] Add image gallery and upload-backed product images.
- [ ] Implement the order-request form.
- [ ] Implement order confirmation with order number.
- [ ] Add contact/location/content pages.

**Exit condition:** a customer can browse a real catalogue and submit a valid cash order request from mobile and desktop.

### Phase 4: admin operations

- [ ] Add the orders route and order table.
- [ ] Add search, filters, date ranges, and status badges.
- [ ] Add order detail and status-history display.
- [ ] Add admin manual-order creation.
- [ ] Add status-transition controls.
- [ ] Add cash collection controls.
- [ ] Add delivery assignment/notes fields.
- [ ] Add product image and stock management.
- [ ] Add dashboard insight cards and operational queues.
- [ ] Add client-side CSV export.

**Exit condition:** every website or offline order can be found, understood, progressed, and completed by the admin without editing the database directly.

### Phase 5: quality and trust

- [ ] Add unit/component tests for cart, forms, route behavior, and status transitions.
- [ ] Add API/function tests for price and stock validation.
- [ ] Add accessibility checks.
- [ ] Add responsive browser checks.
- [ ] Add error boundaries and retry actions.
- [ ] Add SEO metadata and structured product information.
- [ ] Add analytics.
- [ ] Add a manual backup/export routine.
- [ ] Test quota and failure behavior of the free services.

**Exit condition:** common customer and admin workflows pass repeatable tests and failures are understandable.

### Phase 6: deployment and launch

- [ ] Create the Cloudflare Pages project.
- [ ] Configure `npm run build` and `build` output.
- [ ] Add production environment variables.
- [ ] Deploy a preview from a branch.
- [ ] Run a production smoke test.
- [ ] Confirm direct routes load correctly.
- [ ] Confirm Supabase policies work against production.
- [ ] Confirm images and order functions work on the public URL.
- [ ] Publish the free `pages.dev` URL.
- [ ] Prepare a simple customer support process.

**Exit condition:** a real customer can submit a request and the business can fulfil it using the admin panel.

## 13. Launch checklist

- [ ] Real product data loaded.
- [ ] Real product images loaded and compressed.
- [ ] Currency confirmed.
- [ ] Delivery and pickup instructions published.
- [ ] Cash process explained.
- [ ] Contact number/WhatsApp tested.
- [ ] Admin account protected by a strong password.
- [ ] Public users cannot access admin data.
- [ ] Customer order form rejects invalid input.
- [ ] Stock is not oversold by simultaneous requests.
- [ ] Admin can create offline orders.
- [ ] Admin can mark orders confirmed, preparing, ready, delivered, and cancelled.
- [ ] Admin can mark cash collected.
- [ ] Order history is preserved.
- [ ] Backup/export completed.
- [ ] Mobile smoke test completed.
- [ ] Production build passes.

## 14. Ongoing free maintenance

### Each day orders arrive

- Review pending orders.
- Confirm customers.
- Prepare and assign deliveries.
- Record cash collection.
- Update delivery status.

### Weekly

- Export the order/catalog data.
- Review failed or returned deliveries.
- Check low-stock products.
- Check Supabase and Pages usage.
- Review error logs.

### Monthly

- Update dependencies in a branch.
- Run tests and production build.
- Remove unused images and products.
- Review access to admin accounts.
- Check privacy/content pages.

Free hosting removes infrastructure bills, not business operations. Someone still needs to confirm orders, maintain stock, deliver products, and protect customer data.

## 15. Later enhancements

Only after the basic offline workflow is reliable:

- Customer order lookup by order number and phone.
- WhatsApp message generation from an order.
- Printable delivery manifests.
- Product variants with per-size stock.
- Multiple admin roles.
- Sales exports for accounting.
- Customer accounts and order history.
- Reviews and wishlists.
- Custom domain.
- Paid backups or a more reliable production database plan.
