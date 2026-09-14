# MOR AI handoff and progress log

Last updated: 2026-09-14

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
- Committed the implementation as `3fdf8fc2` and pushed it to `origin/main`.
- Updated `README.md` to describe the new order flow and current integration boundary.
- No external Supabase project has been created or connected yet, so the Supabase path is not exercised against a live database.
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

1. There is no deployed backend or connected Supabase project yet; the local schema and Edge Functions are now in the repository.
2. The React data layer supports Supabase when both public environment variables are present and falls back to the legacy Axios API otherwise.
3. The Supabase migration and functions have not been applied/deployed or tested against a live project.
4. The home page uses Picsum placeholder category images.
5. Product images depend on URLs returned by the missing backend.
6. Order totals are recalculated by the local `create_order` database function; the browser only sends item IDs, sizes, and quantities.
7. Stock reservation/release is implemented in the local `update_order_status` function but is not yet validated against a live database.
8. Supabase admin status updates use the protected `update-order-status` function; legacy API mode still depends on `/orders/:id`.
9. Supabase mode uses managed Auth and profile authorization; custom token/email storage remains only for legacy API mode.
10. Admin product/category screens do not have comprehensive error states.
11. Home, product detail, dashboard, and several other fetches have minimal or no visible error handling.
12. Footer Help and Company links point to `#!` placeholders.
13. The primary mobile navigation toggle is implemented; mega-menu behavior on touch devices still needs browser QA.
14. Size selectors are now buttons; unavailable-size disabling and stock-aware selection still need implementation.
15. `.env` and `node_modules` are removed from the Git index and ignored locally; the cleanup is included in the pushed implementation commit.
16. There are no automated test files.

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
6. Create the Supabase project and link it to the repository.
7. Apply and validate the existing migration rather than creating a second duplicate schema.
8. Enable RLS and create the admin role policies before using the connected admin UI.
9. Done locally: Supabase Auth/profile authorization replaces the custom flow when Supabase variables are configured.
10. Done locally: the trusted order-creation function is connected through the conditional data layer.
11. Done locally: the trusted status-update function and history path are connected through the conditional data layer.
12. Done locally: stock reservation/release behavior exists in the status transition function; validate it against the live project.
13. Replace placeholder images and complete product/image management.
14. Add tests, deployment configuration, analytics, and manual backup/export procedures.
15. Deploy to Cloudflare Pages and run the production launch checklist.

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

The latest build completed successfully after the conditional Supabase data-layer/Auth adapter and status-update function changes. The SQL migration has not yet been executed against a local or hosted Postgres/Supabase instance.

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
