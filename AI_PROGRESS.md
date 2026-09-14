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
- No application feature implementation has been completed yet.
- No backend, Supabase project, deployment, schema migration, or order feature has been created yet.

## Current repository facts

The project is a frontend-only Create React App:

- Package name: `mor-shop-frontend`
- React 18.3.1
- React Router 6.26.2
- Axios 1.7.7
- `react-scripts` 5.0.1
- Start command: `npm start`
- Build command: `npm run build`
- Test command: `npm test`
- Axios default API base: `http://localhost:5000/api`
- Axios override: `REACT_APP_API_URL`
- Frontend proxy declaration: `http://localhost:5000`

Existing routes:

- `/`
- `/shop/:gender`
- `/product/:id`
- `/cart`
- `/admin/login`
- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`

Existing browser storage keys:

- `mor_cart`
- `mor_admin_token`
- `mor_admin_email`

## Important findings and known problems

1. There is no backend source, database schema, or order API in this repository.
2. The shop route declares `:gender`, but `src/pages/Shop.js` reads `categoryName` from `useParams()`. Gender and category filtering currently do not work as intended.
3. Navbar links add `?category=...`, but `Shop.js` does not read query parameters.
4. The home page uses Picsum placeholder category images.
5. Product images depend on URLs returned by the missing backend.
6. The cart checkout button only calls a placeholder `alert()`.
7. The cart displays dollars and hard-codes free shipping.
8. There is no order form, order number, order table, delivery status, cash status, status history, or admin order page.
9. The current admin context stores a custom token/email in localStorage; this should be replaced or backed by managed Auth and database authorization.
10. Admin product/category screens do not have comprehensive error states.
11. Home, product detail, dashboard, and several other fetches have minimal or no visible error handling.
12. Footer Help and Company links point to `#!` placeholders.
13. There is no mobile navigation when the main nav is hidden under the responsive breakpoint.
14. Size selectors are rendered as clickable `div` elements and need accessible buttons/keyboard behavior.
15. `.env` is tracked and there is no `.gitignore`.
16. `node_modules` is tracked in the repository. Remove it from version control safely before deployment; do not delete a developer's local install unless necessary.
17. There are no automated test files.

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

Stock should be reserved at confirmation/preparation rather than at an unverified web request. The final rule must be implemented transactionally in the backend.

## Recommended next implementation sequence

1. Read `PROJECT_PLAN.md` and this file before changing code.
2. Confirm operating country, currency, phone format, delivery/pickup rules, and store contact details.
3. Add `.gitignore` and `.env.example`.
4. Check the tracked `.env` contents for secrets without printing them; remove it from version control and rotate any exposed credentials if needed.
5. Remove `node_modules` from version control without deleting the local folder.
6. Create the Supabase project and `supabase/migrations/` structure.
7. Implement categories, products, profiles, orders, order items, and status history.
8. Enable RLS and create the admin role policies before connecting admin UI.
9. Add Supabase Auth and replace the custom admin token flow.
10. Implement the trusted order-creation function for both website and admin-created orders.
11. Fix shop gender/query filtering.
12. Build the customer order-request form and confirmation page.
13. Build the admin orders list, detail view, status controls, manual-order form, and dashboard insights.
14. Improve product image management, stock, currency formatting, loading/error states, responsive UI, and accessibility.
15. Add tests, GitHub Actions, deployment configuration, analytics, and manual backup/export procedures.
16. Deploy to Cloudflare Pages and run the production launch checklist.

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

The last successful checks were:

```text
npm run build
Compiled successfully.

npm test -- --watchAll=false --passWithNoTests
No tests found, exiting with code 0
```

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

