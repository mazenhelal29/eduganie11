alter table public.tenants enable row level security;
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.subscriptions enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.users
  where id = auth.uid()
    and is_active = true
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
    and is_active = true
$$;

create or replace function public.is_owner_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('owner', 'admin')
$$;

create policy "tenant members can read own tenant"
on public.tenants for select
to authenticated
using (id = public.current_tenant_id());

create policy "owners and admins can update own tenant"
on public.tenants for update
to authenticated
using (id = public.current_tenant_id() and public.is_owner_or_admin())
with check (id = public.current_tenant_id() and public.is_owner_or_admin());

create policy "tenant members can read roles"
on public.roles for select
to authenticated
using (tenant_id = public.current_tenant_id());

create policy "owners and admins can manage roles"
on public.roles for all
to authenticated
using (tenant_id = public.current_tenant_id() and public.is_owner_or_admin())
with check (tenant_id = public.current_tenant_id() and public.is_owner_or_admin());

create policy "tenant members can read users"
on public.users for select
to authenticated
using (tenant_id = public.current_tenant_id());

create policy "owners and admins can manage users"
on public.users for all
to authenticated
using (tenant_id = public.current_tenant_id() and public.is_owner_or_admin())
with check (tenant_id = public.current_tenant_id() and public.is_owner_or_admin());

create policy "tenant scoped groups"
on public.groups for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant scoped students"
on public.students for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant scoped subscriptions"
on public.subscriptions for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant scoped attendance"
on public.attendance for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant scoped payments"
on public.payments for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant scoped expenses"
on public.expenses for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant scoped notifications"
on public.notifications for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());
