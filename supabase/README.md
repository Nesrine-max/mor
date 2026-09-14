# Supabase backend foundation

This directory contains the first database and server-function foundation for MOR's catalogue and offline cash-order workflow.

## What is here

- `migrations/0001_initial_schema.sql` creates profiles, categories, products, product images, orders, order items, and order status history.
- The migration enables Row Level Security and gives public users catalogue reads while restricting administration to the admin role.
- `functions/create-order/index.ts` validates customer/admin order requests and calls the trusted `create_order` database function.

No payment provider is used. The order function only records a cash order request and its delivery method.

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

8. Deploy the function with `supabase functions deploy create-order`.
9. Connect the frontend data layer to the Supabase project and function URL.

The service-role key must only exist in the Edge Function environment. It must never be added to `.env.example`, React code, or a public deployment variable.

## Not finished yet

- The current React app still uses the legacy Axios API client for catalogue/admin requests.
- Supabase Auth has not yet replaced `AdminAuthContext`.
- Admin status updates and order reads still require the `/orders` API layer to be connected.
- Stock reservation on confirmation/preparation still needs a transactional status-update function.
- Storage bucket SQL policies still need to be added after the bucket name is finalized.
