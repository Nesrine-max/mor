# Supabase backend foundation

This directory contains the first database and server-function foundation for MOR's catalogue and offline cash-order workflow.

## What is here

- `migrations/0001_initial_schema.sql` creates profiles, categories, products, product images, orders, order items, and order status history.
- The migration enables Row Level Security and gives public users catalogue reads while restricting administration to the admin role.
- `functions/create-order/index.ts` validates customer/admin order requests and calls the trusted `create_order` database function.
- `functions/update-order-status/index.ts` protects admin status changes and calls the transactional status/history/stock function.

No payment provider is used. The functions record cash order requests, delivery progress, status history, and stock transitions only.

The repository is currently linked to the hosted `MOR` project (`fsstqthwpzeypxdasdjo`). Migration `0001_initial_schema.sql` is applied, and both Edge Functions are deployed. The catalogue is still empty until real products and categories are added.

## Setup when a Supabase project is available

1. Install the Supabase CLI and run `supabase init` from the repository root if a local Supabase configuration does not exist yet.
2. Link the local project to the Supabase project.
3. Apply the migration with `supabase db push`.
4. Create the first administrator in Supabase Auth.
5. Set that user's `profiles.role` to `admin` using the protected SQL editor.
6. Create a storage bucket for product images and add storage policies for the admin role.
7. Set the Edge Function secrets in the Supabase dashboard:

   ```text
   SUPABASE_SERVICE_ROLE_KEY=<server-only key>
   APP_ORIGIN=<deployed frontend origin>
   ```

8. Deploy both functions:

   ```bash
   supabase functions deploy create-order --no-verify-jwt
   supabase functions deploy update-order-status
   ```

   `create-order` must allow guest requests from the storefront; its function
   code still restricts offline-source orders to authenticated admins.

9. Add the public project URL and publishable/anon key to the frontend environment:

   ```text
   REACT_APP_SUPABASE_URL=<project URL>
   REACT_APP_SUPABASE_PUBLISHABLE_KEY=<publishable or anon key>
   ```

   When both variables exist, `src/api.js` and `AdminAuthContext` use Supabase. Without them, the legacy Axios API remains the fallback.

The service-role key must only exist in the Edge Function environment. It must never be added to `.env.example`, React code, or a public deployment variable.

## Not finished yet

- The first Supabase Auth user still needs to be promoted from the default `staff` profile role to `admin`.
- The migration and functions are deployed, but the full website-to-admin order flow still needs live testing with real catalogue records.
- Product image storage bucket SQL policies still need to be added after the bucket name is finalized.
- Real product data, images, currency, contact details, and delivery rules still need to be configured.
