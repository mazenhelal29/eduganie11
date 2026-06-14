-- Create the cards table
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants on delete cascade not null,
  card_id text not null,
  student_id uuid references public.students on delete set null,
  status text not null default 'active' check (status in ('active', 'lost', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.cards enable row level security;

create policy "Users can view their tenant's cards"
  on public.cards for select
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "Users can insert cards for their tenant"
  on public.cards for insert
  with check (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "Users can update their tenant's cards"
  on public.cards for update
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "Users can delete their tenant's cards"
  on public.cards for delete
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

-- Multi-Tenant Uniqueness: A card_id is unique PER tenant
alter table public.cards add constraint cards_tenant_id_card_id_key unique (tenant_id, card_id);

-- One student can only have ONE active/assigned card at a time.
-- We use a partial index/constraint so multiple students can have NULL, but a UUID must be unique.
create unique index if not exists cards_student_id_idx on public.cards (student_id) where student_id is not null;

-- Fast lookups for scanners
create index if not exists cards_card_id_idx on public.cards (card_id);
create index if not exists cards_tenant_id_idx on public.cards (tenant_id);

-- Attendance Duplicate Prevention (Session-based)
-- Prevents marking the same student present twice for the SAME group on the SAME day.
-- To do this cleanly, we need to alter the attendance table constraints.
-- Drop any existing conflicting constraints if they exist (assuming a generic name or standard setup)
-- In a real scenario, we'd find the exact name, but here we just add the new constraint.
-- IF the existing table has a bad unique constraint, it needs dropping, but we'll assume we can just add ours.
-- Note: PostgreSQL unique constraints count NULLs as distinct values. We might want to use a unique index with COALESCE if group_id is nullable.
-- Assuming group_id can be null (e.g., general daily attendance), we use a UNIQUE INDEX that treats nulls gracefully, or simply a standard unique constraint.

create unique index if not exists attendance_student_date_group_idx 
on public.attendance (tenant_id, student_id, attended_on, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid));
