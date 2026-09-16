# MOR AI handoff and progress log

Last updated: 2026-09-16

## Purpose

This file is a continuation log for the next AI or developer working on MOR. It records what was inspected, what decisions the user made, what files were changed, and what still needs to happen. Update it after every meaningful implementation session.

## Product decisions confirmed by the user

- MOR should support both order entry paths:
  - Customers submit order requests from the website.
  - Admins manually create orders received through WhatsApp, phone, Instagram, walk-ins, or other offline channels.
- Payments happen in real life with cash.
- No online payment handling is wanted.
- No payment gateway, card processing, wallet integration, payment webhook, or online refund flow should be added.
- Delivery is separate from the website. The admin panel only tracks delivery progress and tells the team what needs to be delivered or followed up.
- The admin needs statuses for every order, operational insights, and a reliable status/history sheet.
- The project should target free hosting and free maintenance tools.

## Work completed in this session and previous session

### Repository inspection

- Confirmed the working directory is the MOR repository.
- Confirmed the initial branch was clean before documentation work.
- Checked for repository-level `AGENTS.md`; none was present.
- Inspected `package.json`, `package-lock.json`, `public/index.html`, all `src` JavaScript files, and the stylesheet.
- Traced all routes, API calls, localStorage keys, admin flows, cart behavior, and CSS layout rules.
- Ran a build and confirmed that it compiles successfully.
- Ran the test command with `--watchAll=false --passWithNoTests`; it reported that no tests exist.
- Removed build output and generated cache artifacts after verification.

### Documentation created

- Added `README.md` with setup, routes, API expectations, state behavior, structure, limitations, and verification notes.
- Added `PROJECT_PLAN.md` with the detailed production roadmap, architecture, database model, order flows, security plan, phases, launch checklist, and maintenance plan.

### Initial implementation slice

- Added `.gitignore` and `.env.example`.
- Removed the tracked `.env` and tracked `node_modules` entries from the Git index without deleting the local files.
- Added `public/_redirects` for SPA deep-link handling on static hosting.
- Added `src/config.js` for configurable locale/currency formatting and offline fulfilment labels.
- Replaced hard-coded price formatting in storefront and admin screens with the shared formatter.
- Changed the cart summary from hard-coded free shipping to delivery confirmation separately.
- Fixed `Shop.js` to use the `gender` route parameter and `category` query parameter.
- Added client-side shop search, category filtering, sorting, loading states, error states, and empty states.
- Added `/order`, a cash-only customer order-request form for delivery or pickup.
- Added `/admin/orders`, an order queue with search/filter controls, order details, and separate order/delivery/cash status controls.
- Added `/admin/orders/new` for manually entering orders from WhatsApp, phone, Instagram, walk-ins, or other offline sources.
- Added order metrics and an order queue section to the admin dashboard.
- Added responsive styles for the shop filters, order request flow, admin order table, status controls, and manual order form.
- Added a responsive mobile navigation toggle and changed product size selectors to keyboard-accessible buttons.
- Added order-detail status-history rendering when the API includes history records.
- Added `supabase/migrations/0001_initial_schema.sql` with catalogue, profiles, offline orders, order items, status history, indexes, RLS policies, and a trusted `create_order` database function.
- Added `supabase/functions/create-order/index.ts` for server-side validation and cash-order creation without payment processing.
- Added `supabase/functions/update-order-status/index.ts` and transactional SQL for protected status changes, status history, and stock reservation/release.
- Added a conditional Supabase data layer in `src/api.js`, `src/supabase.js`, and `AdminAuthContext`; the legacy Axios API remains available when Supabase variables are blank.
- Added `@supabase/supabase-js` and documented the public Supabase environment variables.
- Added `supabase/README.md` describing how to apply and deploy the Supabase foundation.
- Initialized the Supabase CLI configuration with `npx --yes supabase init`, creating `supabase/config.toml` and `supabase/.gitignore`.
- Verified Supabase CLI `2.117.0` is available through `npx`; the standalone executable is not currently on this PowerShell session's PATH.
- Committed and pushed the CLI configuration as `11fb4c76` (`Initialize Supabase CLI configuration`).
- Authenticated the CLI, linked project `MOR` (`fsstqthwpzeypxdasdjo`), and applied migration `0001_initial_schema.sql` to the hosted database.
- Deployed `create-order` with gateway JWT verification disabled for guest website requests, while keeping `update-order-status` JWT-protected.
- Added `0002_product_image_storage.sql`, creating the hosted `product-images` bucket with public reads, 5 MB JPG/PNG/WebP limits, and admin-only writes.
- Added Supabase product-image uploads, previews, validation, and admin product loading/error/empty states.
- Added migrations `0003`–`0005` to move authorization helpers into a non-exposed schema, tighten function search paths, add foreign-key indexes, and separate public catalogue reads from admin reads.
- Added stock-aware product detail/cart behavior, admin category/dashboard error states, a top-level application error fallback, `robots.txt`, and static-host security/cache headers.
- Added the linked Supabase URL and publishable key to the ignored local `.env` for local frontend testing; no service-role key was added to the repository or frontend.
- Verified the hosted catalogue endpoint returns HTTP 200, guest order validation returns the expected HTTP 400, and unauthenticated status updates return HTTP 403.
- Fixed the home page's empty-catalogue state and added `public/favicon.svg`; browser-tested the home, shop, order-empty, and admin-login routes with no application console errors.
- Committed the implementation as `3fdf8fc2` and pushed it to `origin/main`.
- Updated `README.md` to describe the new order flow and current integration boundary.
- The hosted Supabase path is now exercised against the live `MOR` project; the catalogue is currently empty and no admin account has been promoted yet.
- No online payment or courier integration was added.

## Current repository facts

The project is a Create React App frontend with local Supabase migration/function source:

- Package name: `mor-shop-frontend`
- React 18.3.1
- React Router 6.26.2
- Axios 1.7.7
- `@supabase/supabase-js`
- `react-scripts` 5.0.1
- Start command: `npm start`
- Build command: `npm run build`
- Test command: `npm test`
- Axios default API base: `http://localhost:5000/api`
- Axios override: `REACT_APP_API_URL`
- Supabase override: `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_PUBLISHABLE_KEY`
- Supabase CLI in this environment: `npx --yes supabase` (version `2.117.0`)
- Linked Supabase project: `MOR` / `fsstqthwpzeypxdasdjo` (`eu-west-1`)
- Frontend proxy declaration: `http://localhost:5000`

Existing routes:

- `/`
- `/shop/:gender`
- `/product/:id`
- `/cart`
- `/order`
- `/admin/login`
- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`
- `/admin/orders`
- `/admin/orders/new`

Existing browser storage keys:

- `mor_cart`
- `mor_admin_token`
- `mor_admin_email`

## Important findings and known problems

1. The hosted Supabase project is linked and deployed, but the catalogue is empty until products and categories are entered.
2. One Supabase Auth user is now promoted to `admin`; the user still needs to sign in once through the live admin page to complete the browser-level verification.
3. The React data layer supports Supabase when both public environment variables are present and falls back to the legacy Axios API otherwise.
4. The home page uses Picsum placeholder category images.
5. Product image storage and admin upload support are deployed; the first real upload still needs testing after an admin account is promoted.
6. Order totals are recalculated by the hosted `create_order` database function; the browser only sends item IDs, sizes, and quantities.
7. Stock reservation/release is deployed and passed schema/endpoint checks, but needs a real product/order/admin end-to-end test.
8. Supabase admin status updates use the protected `update-order-status` function; legacy API mode still depends on `/orders/:id`.
9. Supabase mode uses managed Auth and profile authorization; custom token/email storage remains only for legacy API mode.
10. Product, category, dashboard, and catalogue screens now have loading, empty, save, and fetch failure states where their current flows need them; broader automated coverage is still missing.
11. Footer Help and Company links point to `#!` placeholders.
12. The primary mobile navigation toggle is implemented; mega-menu behavior on touch devices still needs browser QA.
13. Size selectors are buttons with unavailable-size disabling and stock-aware cart quantity clamping.
14. `.env`, `node_modules`, and `.vercel` are ignored locally; `.env` and `node_modules` were removed from the Git index in earlier commits.
15. There are no automated test files.
16. Supabase advisors now report only the managed `public.rls_auto_enable()` warning; MOR-owned helper/function warnings were removed.

## Agreed target order model

All orders, regardless of source, should share one schema and one admin workflow.

Order sources:

- `website`
- `whatsapp`
- `phone`
- `instagram`
- `walk_in`
- `other`

Separate status dimensions:

- Order: `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`
- Delivery: `not_required`, `awaiting_assignment`, `assigned`, `out_for_delivery`, `delivered`, `failed`, `returned`
- Cash: `cash_outstanding`, `cash_collected`, `partially_collected`

Order records must preserve product name, size, quantity, and price snapshots. A status history table should record field, old value, new value, actor, note, and time.

Stock is reserved transactionally when an order moves into confirmation/preparation/ready/completed and released when a reserved order is cancelled. This rule exists in the local SQL function but still needs live-project validation.

## Recommended next implementation sequence

1. Read `PROJECT_PLAN.md` and this file before changing code.
2. Confirm operating country, currency, phone format, delivery/pickup rules, and store contact details.
3. Done: `.gitignore` and `.env.example` are present.
4. Done: the tracked `.env` was removed from Git without printing its contents; review/rotate any historical credential if one existed.
5. Done: `node_modules` was removed from version control without deleting the local folder.
6. Done: authenticate the CLI, link project `fsstqthwpzeypxdasdjo`, and apply migrations `0001` through `0005`.
7. Done: deploy `create-order` and `update-order-status`; keep the former guest-accessible and the latter JWT-protected.
8. Done: validate public catalogue reads, guest-order validation, and the protected admin endpoint against the hosted project.
9. Done: create the first administrator in Supabase Auth and promote that user's profile role to `admin` through the linked CLI.
10. Add categories/products and configure real images, currency, contact details, and delivery rules.
11. Done: add the `product-images` storage bucket and admin image policies; test a real upload after admin setup.
12. Complete a real website order and admin-created order test, including status transitions, stock reservation/release, and cash/delivery tracking.
13. Replace placeholder images and complete product/image management.
14. Done: add deployment configuration. Still needed: automated tests, analytics, and manual backup/export procedures.
15. Done for the current Vercel deployment; if hosting is migrated to Cloudflare Pages later, repeat the production launch checklist there.

## Non-negotiable constraints for future work

- Do not add online payment handling.
- Do not add payment gateway credentials or webhooks.
- Do not treat delivery as an integrated courier system in the first release.
- Do not expose Supabase secret/service-role keys to browser code.
- Do not trust client-calculated totals or stock.
- Do not silently discard unrelated user changes.
- Do not claim production readiness until both website-created and admin-created orders have been tested end to end.
- Keep free-tier limits and inactivity behavior visible in the documentation.

## Verification record

The latest successful checks were:

```text
npm run build
Compiled successfully.

npm test -- --watchAll=false --passWithNoTests
No tests found, exiting with code 0
```

The latest build completed successfully after the conditional Supabase data-layer/Auth adapter, product image upload, Vercel deployment configuration, and admin-login accessibility changes. Migrations `0001` through `0005` are applied to the hosted project; they have not been run against a local Docker Postgres instance.

### 2026-09-14 - First implementation slice verified

- Re-ran `npm run build`; it compiled successfully and produced the deployable `build/` directory.
- Re-ran `npm test -- --watchAll=false --passWithNoTests`; it exited successfully with no test files present.
- Ran `git diff --check`; no whitespace errors were reported. Git only emitted the repository's normal LF/CRLF conversion warnings.
- Confirmed there is no `psql` or Supabase CLI available in this environment, so the migration and Edge Function remain unexecuted/un-deployed.
- Remaining integration boundary: the React app still uses the legacy Axios API, while the local Supabase schema/function foundation is not connected to it.
- Next exact task: create/configure the free Supabase project, apply the migration, replace custom admin token login with Supabase Auth, then wire catalog/order reads and protected status updates to the deployed data layer.

### 2026-09-14 - GitHub repository handling

- Confirmed the public remote is `https://github.com/Nesrine-max/mor`, with `main` as the default branch.
- Committed the implementation and pushed it to GitHub; the implementation commit is `3fdf8fc2`.
- A temporary CI workflow and build-only dependency were added while interpreting the GitHub request, then removed after the user clarified that GitHub should only be used for commits/pushes.
- The cleanup commit removes `.github/workflows/` and the CI-only `yaml` dependency while preserving the application, Supabase foundation, documentation, and repository hygiene changes.

### 2026-09-14 - Supabase data-layer slice

- Added `src/supabase.js` and conditional Supabase/legacy behavior in `src/api.js`.
- Added Supabase Auth session restoration and admin-profile authorization while retaining legacy login fallback.
- Connected catalogue reads, product/category CRUD, order reads, customer order creation, and admin status updates to Supabase APIs/functions.
- Added `update-order-status` Edge Function and transactional SQL for status history, stock reservation, stock release, and inventory state.
- Updated README and Supabase setup docs with public frontend variables and server-only secret rules.
- Verified `npm test -- --watchAll=false --passWithNoTests`, `npm run build`, and `git diff --check` locally.
- Blocker: no Supabase project/CLI is available in this environment, so migration/function deployment and live RLS validation remain pending.

After implementation begins, record every relevant command and result here. A failed check must remain documented until fixed.

### 2026-09-15 - Supabase CLI initialization

- Confirmed `npx --yes supabase --version` returns `2.117.0`.
- Ran `npx --yes supabase init` successfully in the existing repository.
- Added and pushed `supabase/config.toml` and `supabase/.gitignore` in commit `11fb4c76`.
- The initial `npx --yes supabase projects list` check returned `LegacyPlatformAuthRequiredError` before the user authenticated the CLI; authentication was completed later in the same session.
- The standalone `supabase` command is not discoverable in the current PowerShell PATH, but the CLI is usable through `npx`.
- The follow-up hosted connection, migration push, and function deployment are recorded in the next entry.

### 2026-09-15 - Hosted Supabase connection and browser verification

- Confirmed the CLI session is authenticated and linked to `MOR` (`fsstqthwpzeypxdasdjo`).
- `npx --yes supabase db push` applied `0001_initial_schema.sql`; `npx --yes supabase migration list` reports local and remote `0001` in sync.
- Deployed `create-order` and `update-order-status`; redeployed `create-order --no-verify-jwt` so guest storefront requests reach its internal source validation.
- Confirmed the hosted catalogue REST query returns HTTP 200 with an empty result, the guest order function rejects an empty item list with HTTP 400, and the admin status function rejects a non-admin with HTTP 403.
- Added linked public Supabase variables to the ignored local `.env` and verified `npm run build` still compiles successfully.
- Browser-tested `/`, `/shop/women`, `/order`, and `/admin/login` through the local app. The empty catalogue now renders a useful message instead of loading forever; no application console errors remain.
- Read-only hosted counts are currently `users=0`, `admins=0`, `categories=0`, `products=0`, and `orders=0`.
- The first dry-run after deployment hit a transient pooler authentication timeout; a retry passed and reports the remote database is up to date.
- A legacy service-role key appeared in the CLI's raw API-key listing output during setup; it was not copied into files or commands. Consider rotating legacy API keys in Supabase project settings if the output is treated as exposed.
- Next exact task: create/promote the first admin, add catalogue records, configure the production frontend environment, and complete a real order/status flow.

### 2026-09-15 - Product image storage workflow

- Added `supabase/migrations/0002_product_image_storage.sql` and applied it to the linked project.
- Verified the hosted `product-images` bucket is public-read, limited to 5 MB, and restricted to JPG/PNG/WebP; verified all four storage policies exist.
- Added `uploadProductImage` to the Supabase data layer and connected the admin product form to upload previews and storage-backed image URLs.
- Added admin product loading, save/delete error states, saving state, empty state, and responsive table overflow handling.
- Verified `npm test -- --watchAll=false --passWithNoTests`, `npm run build`, and `git diff --check` after the implementation.
- Committed and pushed as `33a48413` (`Add product image storage workflow`).
- Next exact task: promote the first Auth user to admin, add real categories/products, test one image upload, then complete the end-to-end order flow.

### 2026-09-16 - Security, inventory UX, and hosting preparation

- Applied migrations `0003_security_hardening.sql`, `0004_split_public_catalogue_policies.sql`, and `0005_consolidate_catalogue_read_policies.sql` to the hosted project.
- `supabase db lint --linked` reports no schema errors. Advisors now report only Supabase's managed `public.rls_auto_enable()` warning; application-owned warnings were addressed.
- An initial post-hardening anonymous catalogue check returned permission errors because public policies invoked an authenticated-only helper; migration `0004` split those policies, and migration `0005` consolidated authenticated reads. Final public checks return HTTP 200 for categories, products, and orders.
- Added stock-aware add-to-bag/cart quantity behavior, admin category/dashboard error and empty states, a global React error boundary, `public/robots.txt`, and `public/_headers` for static hosting.
- Browser smoke-tested the empty home/shop/product and protected admin routes with no application console errors on the final pages.
- Verified `npm test -- --watchAll=false --passWithNoTests`, `npm run build`, `git diff --check`, migration sync, and hosted schema lint.
- Commits pushed: `5db52713` (security hardening), `e4516b40` (public catalogue policy fix), `bb9d235c` (policy consolidation).
- Remaining blocker: Supabase still has zero users/products/categories/orders; the first admin account, real catalogue data, legacy-key rotation, and hosting-account setup require user-side business/account input.

### 2026-09-16 - Vercel production deployment

- Created and linked the Vercel project `hz16/mor` using the authenticated Vercel CLI.
- Added production and preview frontend variables for the hosted Supabase URL, publishable key, currency, and locale. No service-role or other secret key was added to Vercel.
- Deployed the React build to the stable production origin: `https://mor-ashen.vercel.app`.
- Set the Supabase Edge Function `APP_ORIGIN` secret to the Vercel production origin.
- Added `vercel.json` for Vercel-native security headers and immutable caching for hashed static assets. Kept `public/_redirects` and `public/_headers` for Cloudflare Pages compatibility.
- GitHub auto-linking was unavailable because the authenticated Vercel account does not have the repository permissions required for automatic integration. Direct CLI deployment works, and no GitHub Actions workflow was added.
- The Vercel project is configured for `npm run build` with `build` as the output directory. Production smoke checks and direct-route checks are recorded after the final header deployment.
- Remaining blocker: the hosted database still has zero users/products/categories/orders. The first admin, real catalogue data, currency/contact/delivery confirmation, service-key rotation, real image upload, and complete website/admin order test require user-side business/account input.

### 2026-09-16 - Production verification and admin-login polish

- Added autocomplete metadata, explicit labels, a submitting state, and Supabase-friendly error text to `src/pages/admin/Login.js`.
- `npm test -- --watchAll=false --passWithNoTests`: passed; no test files exist.
- `npm run build`: passed; production bundle compiled successfully.
- `git diff --check`: passed.
- Live HTTP checks against `https://mor-ashen.vercel.app`: `/`, `/shop/women`, `/product/1`, `/order`, `/admin/login`, and `/robots.txt` all returned HTTP 200. SPA deep routes include the Vercel security headers; hashed JavaScript returned immutable one-year caching.
- Live function check with the production origin: `create-order` returned the expected HTTP 400 for an empty item list and `Access-Control-Allow-Origin: https://mor-ashen.vercel.app`.
- Real-browser checks: home and women collection rendered the empty-catalogue state, direct `/admin/dashboard` redirected to `/admin/login`, Supabase catalogue requests returned HTTP 200, and the final admin-login page reported zero console errors and zero warnings.
- Committed and pushed the deployment/docs slice as `cfe56249` and the login polish as `8d6856bd`; the current `main` branch is deployed to the stable Vercel alias.

### 2026-09-16 - Secret-key migration readiness

- Updated both Supabase Edge Functions to prefer the hosted `SUPABASE_SECRET_KEYS["default"]` map, with `SUPABASE_SECRET_KEY` and legacy `SUPABASE_SERVICE_ROLE_KEY` fallbacks for compatibility.
- Redeployed `create-order` and `update-order-status` to the linked project; the guest order validation/CORS check still passes with HTTP 400 and the production origin.
- The user can now create the new secret key in Supabase `Project Settings` → `API Keys`, test the live functions, and deactivate the exposed legacy `service_role` key without requiring a code change.

### 2026-09-16 - First admin promotion

- Queried the hosted Auth/profile records and found two confirmed users; did not guess between them.
- Promoted the user identified by the requested `zinounew123` account to `admin` through `supabase db query --linked`.
- Verified hosted counts: `users=2`, `admins=1`, `categories=0`, `products=0`, and `orders=0`.
- Remaining user action: sign in at `https://mor-ashen.vercel.app/admin/login`, then add the real catalogue or provide the catalogue data for CLI import.

## How to update this handoff

After each work session, add a dated entry containing:

- Files created or changed.
- User-visible behavior completed.
- Tests/build/lint commands and results.
- Database or deployment changes.
- Known risks or blockers.
- The next exact task.

Example:

```markdown
### 2026-09-15 - Supabase foundation

- Added `supabase/migrations/001_initial_schema.sql`.
- Added RLS policies for public catalogue reads and admin writes.
- Verified migrations locally.
- Still missing: order creation function and frontend client wiring.
- Next task: replace `AdminAuthContext` with Supabase Auth.
```
