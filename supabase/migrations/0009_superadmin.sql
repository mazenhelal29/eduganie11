-- Add is_superadmin to users
alter table public.users add column if not exists is_superadmin boolean not null default false;

-- Add subscription_end_date to tenants with a 14 days default
alter table public.tenants add column if not exists subscription_end_date timestamptz not null default (now() + interval '14 days');

-- Create helper function for superadmin check
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_superadmin
  from public.users
  where id = auth.uid()
    and is_active = true
$$;

-- Grant superadmins full access to all tenants
create policy "superadmins can manage all tenants"
on public.tenants for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

-- Grant superadmins full access to all users
create policy "superadmins can manage all users"
on public.users for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

-- Set specific email as superadmin if exists
update public.users 
set is_superadmin = true 
where id in (select id from auth.users where email = 'mazenhelal29@gmail.com');
