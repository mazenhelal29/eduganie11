# EduGenie Supabase Setup

Run the SQL files in this order from the Supabase SQL Editor:

1. `supabase/migrations/0001_foundation.sql`
2. `supabase/migrations/0002_operations.sql`
3. `supabase/migrations/0003_indexes.sql`
4. `supabase/migrations/0004_rls.sql`
5. `supabase/migrations/0005_onboarding.sql`

## Tables Created

- `tenants`
- `roles`
- `users`
- `groups`
- `students`
- `subscriptions`
- `attendance`
- `payments`
- `expenses`
- `notifications`

## Important Notes

- Every operational table has `tenant_id`.
- RLS is enabled on all app tables.
- Tenant isolation is enforced through `public.current_tenant_id()`.
- `users.id` references `auth.users.id`, so auth users must exist before inserting user profiles.
- First workspace creation should call `public.create_tenant_with_owner(...)` after signup.
- The frontend still uses local browser state. The next step is adding Supabase client queries and replacing `localStorage` actions with database operations.

## First Tenant Creation

After a user signs up, call this RPC from the app:

```ts
await supabase.rpc("create_tenant_with_owner", {
  tenant_name: "Demo Education Center",
  tenant_slug: "demo-education-center",
  owner_full_name: "Owner Name",
  owner_phone: "+20...",
});
```

## Frontend Environment

Create `.env.local` from `.env.example`, then add the anon public key from:

Project Settings -> API -> Project API keys -> `anon public`

```env
NEXT_PUBLIC_SUPABASE_URL=https://efinwumrydpynsdflfnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```
