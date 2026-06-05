create extension if not exists "pgcrypto";

create type public.app_role as enum ('owner', 'admin', 'staff');
create type public.student_status as enum ('active', 'paused', 'archived');
create type public.subscription_status as enum ('active', 'overdue', 'paused', 'cancelled');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
create type public.expense_category as enum ('rent', 'salaries', 'utilities', 'miscellaneous');
create type public.notification_kind as enum ('renewal', 'overdue', 'reminder', 'system');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name public.app_role not null,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  full_name text not null,
  phone text,
  role public.app_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();
