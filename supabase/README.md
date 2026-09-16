# Supabase backend foundation

This directory contains the first database and server-function foundation for MOR's catalogue and offline cash-order workflow.

## What is here

- `migrations/0001_initial_schema.sql` creates profiles, categories, products, product images, orders, order items, and order status history.
- `migrations/0002_product_image_storage.sql` creates the public-read/admin-write product image bucket.
- `migrations/0003`–`0005` harden helper functions, RLS policies, and catalogue read-policy performance.
- The migration enables Row Level Security and gives public users catalogue reads while restricting administration to the admin role.
- `functions/create-order/index.ts` validates customer/admin order requests and calls the trusted `create_order` database function.
- `functions/update-order-status/index.ts` protects admin status changes and calls the transactional status/history/stock function.

No payment provider is used. The functions record cash order requests, delivery progress, status history, and stock transitions only.

The repository is currently linked to the hosted `MOR` project (`fsstqthwpzeypxdasdjo`). Migrations `0001`–`0005` are applied, and both Edge Functions are deployed. The catalogue is still empty until real products and categories are added.

## Setup when a Supabase project is available

1. Install the Supabase CLI and run `supabase init` from the repository root if a local Supabase configuration does not exist yet.
2. Link the local project to the Supabase project.
3. Apply the migration with `supabase db push`.
4. Create the first administrator in Supabase Auth.
5. Set that user's `profiles.role` to `admin` using the protected SQL editor.
6. The `0002_product_image_storage.sql` migration creates the public `product-images` bucket, limits uploads to 5 MB JPG/PNG/WebP files, and adds admin-only write policies.
7. Create the new publishable/secret API key pair from `Project Settings` → `API Keys` when the project still only has legacy keys. The deployed functions prefer the platform-provided `SUPABASE_SECRET_KEYS["default"]` value and retain `SUPABASE_SERVICE_ROLE_KEY` as a compatibility fallback:

   ```text
   APP_ORIGIN=<deployed frontend origin>
   ```

   `APP_ORIGIN` is a custom function secret. The Supabase secret-key map is injected automatically; never copy a secret key into the repository, React environment, or public hosting variables.

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

For a leaked legacy `service_role` key, create the new secret key first, verify the deployed functions, then deactivate the old `service_role` key under `Project Settings` → `API Keys` → `Legacy API Keys`. Do not revoke the JWT signing key as part of this routine key replacement.

## Not finished yet

- One Supabase Auth user is promoted to `admin`; the live admin sign-in and first real product upload still need to be tested.
- The migration and functions are deployed, but the full website-to-admin order flow still needs live testing with real catalogue records.
- A real admin upload still needs to be tested after the first admin account is promoted.
- Supabase's remaining advisor warning concerns the managed `public.rls_auto_enable()` helper, not MOR's application functions or policies.
- DZD is configured for the first market. Real product data/images, contact details, and delivery rules still need to be completed.
